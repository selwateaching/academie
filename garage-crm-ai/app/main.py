import csv
import io
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, wait
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import autopilot, models, replies
from .relances import aware, due_companies
from .agent import emailfinder, enrichment, mailer, prospector, qualifier, writer
from .agent.targets import CATEGORIES
from .config import get_settings
from .db import Base, SessionLocal, engine, get_db
from .security import hash_password, make_token, read_token, verify_password

STATIC = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(_app):
    startup()
    autopilot.start_scheduler()
    yield


app = FastAPI(title="GARAGE CRM AI", lifespan=lifespan)


def startup():
    s = get_settings()
    if os.environ.get("APP_ENV") == "production" and (
            s.secret_key in ("", "dev-secret-change-me", "change-me-long-random-string") or s.admin_password in ("", "change-me-now")):
        raise RuntimeError("Production : définissez un SECRET_KEY aléatoire et un ADMIN_PASSWORD personnel dans l'environnement.")
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if not db.scalar(select(func.count(models.User.id))) and s.admin_password:
            db.add(models.User(email=s.admin_email.lower(), name="Administrateur", role="admin",
                               password_hash=hash_password(s.admin_password)))
            db.commit()


# ---------- Authentification et rôles ----------
def current_user(authorization: str = Header(default=""), db: Session = Depends(get_db)) -> models.User:
    uid = read_token(authorization.removeprefix("Bearer ").strip())
    user = db.get(models.User, uid) if uid else None
    if not user or not user.active:
        raise HTTPException(401, "Non authentifié")
    return user


def require(*roles: str):
    def dep(user: models.User = Depends(current_user)):
        if user.role not in roles:
            raise HTTPException(403, "Droits insuffisants")
        return user
    return dep


ANY = require("admin", "manager", "commercial")
MANAGER = require("admin", "manager")
ADMIN = require("admin")


class LoginIn(BaseModel):
    email: str
    password: str


MAX_FAILS, WINDOW = 5, 15 * 60
_fails: dict[str, list[float]] = {}


def _recent_fails(key: str) -> list[float]:
    now = time.time()
    _fails[key] = [t for t in _fails.get(key, []) if now - t < WINDOW]
    return _fails[key]


@app.post("/api/auth/login")
def login(data: LoginIn, request: Request, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    key = f"{email}|{request.client.host if request.client else '?'}"
    if len(_recent_fails(key)) >= MAX_FAILS:
        raise HTTPException(429, "Trop de tentatives. Réessayez dans 15 minutes.")
    user = db.scalar(select(models.User).where(models.User.email == email))
    if not user or not user.active or not verify_password(data.password, user.password_hash):
        _fails.setdefault(key, []).append(time.time())
        raise HTTPException(401, "Identifiants invalides")
    _fails.pop(key, None)
    return {"token": make_token(user.id), "name": user.name, "role": user.role}


@app.get("/api/me")
def me(user: models.User = Depends(ANY)):
    return {"email": user.email, "name": user.name, "role": user.role}


class UserIn(BaseModel):
    email: str
    name: str = ""
    role: str = "commercial"
    password: str


class UserPatch(BaseModel):
    name: str | None = None
    role: str | None = None
    active: bool | None = None
    password: str | None = None


@app.patch("/api/users/{uid}")
def patch_user(uid: int, data: UserPatch, db: Session = Depends(get_db), admin=Depends(ADMIN)):
    u = db.get(models.User, uid) or _404()
    ch = data.model_dump(exclude_unset=True)
    if "role" in ch and ch["role"] not in models.ROLES:
        raise HTTPException(422, "Rôle invalide")
    if u.id == admin.id and (ch.get("active") is False or ("role" in ch and ch["role"] != "admin")):
        raise HTTPException(409, "Vous ne pouvez pas désactiver ou rétrograder votre propre compte")
    if "password" in ch:
        if len(ch["password"] or "") < 8:
            raise HTTPException(422, "Mot de passe : 8 caractères minimum")
        u.password_hash = hash_password(ch.pop("password"))
    for k, v in ch.items():
        setattr(u, k, v)
    db.commit()
    return {"id": u.id, "email": u.email, "name": u.name, "role": u.role, "active": u.active}


@app.get("/api/users")
def list_users(db: Session = Depends(get_db), _=Depends(ADMIN)):
    return [{"id": u.id, "email": u.email, "name": u.name, "role": u.role, "active": u.active}
            for u in db.scalars(select(models.User).order_by(models.User.id))]


@app.post("/api/users", status_code=201)
def create_user(data: UserIn, db: Session = Depends(get_db), _=Depends(ADMIN)):
    if data.role not in models.ROLES:
        raise HTTPException(422, "Rôle invalide")
    if len(data.password) < 8:
        raise HTTPException(422, "Mot de passe : 8 caractères minimum")
    if db.scalar(select(models.User).where(models.User.email == data.email.lower())):
        raise HTTPException(409, "Email déjà utilisé")
    u = models.User(email=data.email.lower().strip(), name=data.name, role=data.role,
                    password_hash=hash_password(data.password))
    db.add(u); db.commit()
    return {"id": u.id}


# ---------- Entreprises ----------
EMAIL_OK = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")


def clean_email(v: str | None) -> str:
    v = (v or "").strip().lower()
    if v and not EMAIL_OK.match(v):
        raise HTTPException(422, "Adresse e-mail invalide (exemple : contact@entreprise.fr)")
    return v


def company_out(c: models.Company) -> dict:
    return {k: getattr(c, k) for k in (
        "id", "name", "category", "city", "address", "phone", "website", "email", "contact_name", "source",
        "rating", "rating_count", "score", "score_reason", "status", "next_action", "notes", "do_not_contact")
    } | {"last_contact": c.last_contact.isoformat() if c.last_contact else None,
         "whatsapp_url": writer.whatsapp_url(c)}


class CompanyIn(BaseModel):
    name: str
    category: str = ""
    city: str = ""
    address: str = ""
    phone: str = ""
    website: str = ""
    email: str = ""
    contact_name: str = ""
    notes: str = ""


class CompanyPatch(BaseModel):
    name: str | None = None
    category: str | None = None
    city: str | None = None
    phone: str | None = None
    website: str | None = None
    email: str | None = None
    contact_name: str | None = None
    notes: str | None = None
    status: str | None = None
    next_action: str | None = None
    do_not_contact: bool | None = None


@app.get("/api/categories")
def categories(_=Depends(ANY)):
    return [{"key": k, "label": v[0]} for k, v in CATEGORIES.items()]


@app.get("/api/companies")
def list_companies(status: str | None = None, category: str | None = None, min_score: int | None = None,
                   q: str | None = None, db: Session = Depends(get_db), _=Depends(ANY)):
    stmt = select(models.Company).order_by(models.Company.score.desc().nulls_last(), models.Company.id.desc())
    if status:
        stmt = stmt.where(models.Company.status == status)
    else:
        stmt = stmt.where(models.Company.status != "archive")      # les archivés sortent de la liste en cours
    if category:
        stmt = stmt.where(models.Company.category == category)
    if min_score is not None:
        stmt = stmt.where(models.Company.score >= min_score)
    if q:
        stmt = stmt.where(models.Company.name.ilike(f"%{q}%"))
    return [company_out(c) for c in db.scalars(stmt.limit(500))]


@app.post("/api/companies", status_code=201)
def create_company(data: CompanyIn, db: Session = Depends(get_db), _=Depends(ANY)):
    fields = data.model_dump() | {"email": clean_email(data.email)}
    c = models.Company(**fields, source="manuel")
    c.score, c.score_reason, c.next_action = qualifier.qualify(c)
    db.add(c); db.commit()
    return company_out(c)


@app.patch("/api/companies/{cid}")
def patch_company(cid: int, data: CompanyPatch, db: Session = Depends(get_db), _=Depends(ANY)):
    c = db.get(models.Company, cid) or _404()
    changes = data.model_dump(exclude_unset=True)
    if "status" in changes and changes["status"] not in models.STATUSES:
        raise HTTPException(422, "Statut invalide")
    if "email" in changes:
        changes["email"] = clean_email(changes["email"])
    for k, v in changes.items():
        setattr(c, k, v)
    if changes.get("status") in ("contacte", "rdv"):
        c.last_contact = datetime.now(timezone.utc)
    db.commit()
    return company_out(c)


@app.delete("/api/companies/{cid}", status_code=204)
def delete_company(cid: int, db: Session = Depends(get_db), _=Depends(MANAGER)):
    db.delete(db.get(models.Company, cid) or _404()); db.commit()


@app.post("/api/companies/{cid}/qualify")
def requalify(cid: int, db: Session = Depends(get_db), _=Depends(ANY)):
    c = db.get(models.Company, cid) or _404()
    c.score, c.score_reason, c.next_action = qualifier.qualify(c)
    db.commit()
    return company_out(c)


def _404():
    raise HTTPException(404, "Introuvable")


def _lookup(snap: dict) -> dict:
    """Exécuté en parallèle : ne touche PAS à la base, seulement au réseau."""
    out: dict = {}
    try:
        if snap["need_email"]:
            out["email"] = emailfinder.find_email(snap["website"])
        if snap["need_manager"]:
            out["manager"] = enrichment.find_manager(snap["name"], snap["city"], snap["address"])
    except Exception:
        pass
    return out


def _note(c: models.Company, text: str):
    c.notes = (c.notes + "\n" if c.notes else "") + text


def enrich_companies(db: Session, companies: list[models.Company], budget: int = 75) -> dict:
    """Trouve email (site web de l'entreprise) et gérant (registre public) des prospects, en parallèle.

    Ne remplace jamais une valeur déjà saisie. Tout ce qui est trouvé est noté « à vérifier »."""
    jobs = []
    for c in companies:
        snap = {"name": c.name, "city": c.city, "address": c.address, "website": c.website,
                "need_email": not c.email and bool(c.website), "need_manager": not c.contact_name}
        if snap["need_email"] or snap["need_manager"]:
            jobs.append((c, snap))
    emails = managers = 0
    if jobs:
        ex = ThreadPoolExecutor(max_workers=8)
        futs = {ex.submit(_lookup, snap): c for c, snap in jobs}
        done, _ = wait(futs, timeout=budget)
        ex.shutdown(wait=False, cancel_futures=True)
        for f in done:
            c, res = futs[f], f.result()
            e, m = res.get("email"), res.get("manager")
            if e and not c.email:
                c.email = e["email"]
                _note(c, f"Email trouvé sur {e['source']} – à vérifier")
                emails += 1
            if m and not c.contact_name:
                c.contact_name = m["contact_name"]
                _note(c, f"Gérant : {m['contact_name']} ({m['qualite'] or 'dirigeant'}) – registre public, SIREN {m['siren']} – à vérifier")
                managers += 1
        db.commit()
    return {"checked": len(jobs), "emails": emails, "managers": managers, "found": emails + managers}


@app.post("/api/companies/{cid}/find-manager")
def find_manager(cid: int, db: Session = Depends(get_db), _=Depends(ANY)):
    """« trouver » : cherche l'email (site web) et le gérant (registre public) de ce prospect."""
    c = db.get(models.Company, cid) or _404()
    res = enrich_companies(db, [c])
    return company_out(c) | res | {"found": res["found"] > 0,
                                   "reason": "" if res["found"] else "Rien de fiable trouvé : saisissez-le à la main"}


@app.post("/api/agent/enrich")
def enrich_all(db: Session = Depends(get_db), _=Depends(MANAGER)):
    """Complète emails et gérants manquants (30 prospects à la fois, les mieux notés d'abord)."""
    todo = list(db.scalars(select(models.Company).where(
        (models.Company.contact_name == "") | ((models.Company.email == "") & (models.Company.website != "")))
        .order_by(models.Company.score.desc().nulls_last()).limit(30)))
    return enrich_companies(db, todo)


# ---------- Agent IA : recherche + qualification ----------
class SearchIn(BaseModel):
    category: str
    city: str
    limit: int = 20


def _ingest(db: Session, rows: list[dict], min_score: int = 0) -> dict:
    added = skipped = 0
    new: list[models.Company] = []
    for r in rows:
        ref = r.get("source_ref")
        if ref and db.scalar(select(models.Company.id).where(models.Company.source_ref == ref)):
            skipped += 1
            continue
        c = models.Company(**{k: v for k, v in r.items() if hasattr(models.Company, k)})
        c.score, c.score_reason, c.next_action = qualifier.qualify(c)
        if c.score < min_score:
            c.status = "ecarte"
        db.add(c)
        new.append(c)
        added += 1
    db.commit()
    # l'agent complète tout seul emails et gérants des nouveaux prospects
    found = enrich_companies(db, new) if new else {"emails": 0, "managers": 0}
    return {"added": added, "duplicates": skipped, "emails_found": found["emails"], "managers_found": found["managers"]}


@app.post("/api/agent/search")
def agent_search(data: SearchIn, db: Session = Depends(get_db), _=Depends(MANAGER)):
    try:
        rows = prospector.search_places(data.category, data.city.strip(), max(1, min(data.limit, 60)))
    except prospector.ProspectorError as e:
        raise HTTPException(400, str(e))
    return {"found": len(rows)} | _ingest(db, rows)


@app.post("/api/agent/import-csv")
async def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(MANAGER)):
    """Colonnes acceptées : name, category, city, address, phone, website, email, contact_name."""
    text = (await file.read()).decode("utf-8-sig", errors="replace")
    rows = []
    for rec in csv.DictReader(io.StringIO(text), delimiter=";" if ";" in text.split("\n")[0] else ","):
        rec = {k.strip().lower(): (v or "").strip() for k, v in rec.items() if k}
        if rec.get("name"):
            rows.append({k: rec.get(k, "") for k in ("name", "category", "city", "address", "phone", "website",
                                                    "email", "contact_name")} | {"source": "import_csv"})
    return {"found": len(rows)} | _ingest(db, rows)


@app.post("/api/companies/{cid}/stop")
def company_stop(cid: int, db: Session = Depends(get_db), _=Depends(ANY)):
    """Le prospect a demandé à ne plus être contacté : opposition, archivage, message de confirmation."""
    c = db.get(models.Company, cid) or _404()
    result = replies.handle_stop(db, c, reason="signalé manuellement")      # d'abord l'action, puis l'état à jour
    return company_out(c) | result


@app.get("/api/replies")
def get_replies(db: Session = Depends(get_db), _=Depends(MANAGER)):
    ev = db.scalars(select(models.InboxEvent).order_by(models.InboxEvent.id.desc()).limit(15))
    return {"configured": replies.imap_settings() is not None, "host": get_settings().imap_host,
            "events": [{"company": (db.get(models.Company, e.company_id).name if e.company_id else ""), "kind": e.kind,
                        "summary": e.summary, "at": e.at.isoformat()} for e in ev]}


@app.post("/api/replies/check")
def check_replies(db: Session = Depends(get_db), _=Depends(MANAGER)):
    return replies.check_inbox(db)


# ---------- Messages (brouillon -> validation humaine -> envoi) ----------
def message_out(m: models.Message) -> dict:
    return {"id": m.id, "company_id": m.company_id, "company": m.company.name, "to": m.company.email,
            "kind": m.kind, "subject": m.subject, "body": m.body, "status": m.status,
            "approved_by": m.approved_by, "created_at": m.created_at.isoformat()}


class DraftIn(BaseModel):
    kind: str = "email"


class MessagePatch(BaseModel):
    subject: str | None = None
    body: str | None = None


@app.post("/api/companies/{cid}/draft", status_code=201)
def make_draft(cid: int, data: DraftIn, db: Session = Depends(get_db), _=Depends(ANY)):
    c = db.get(models.Company, cid) or _404()
    if c.do_not_contact:
        raise HTTPException(409, "Ce prospect s'est opposé à la prospection")
    subject, body = writer.draft(c, data.kind)
    m = models.Message(company_id=c.id, kind=data.kind, subject=subject, body=body)
    db.add(m); db.commit()
    return message_out(m)


@app.get("/api/messages")
def list_messages(status: str | None = None, db: Session = Depends(get_db), _=Depends(ANY)):
    stmt = select(models.Message).order_by(models.Message.id.desc())
    if status:
        stmt = stmt.where(models.Message.status == status)
    return [message_out(m) for m in db.scalars(stmt.limit(200))]


def _msg(db: Session, mid: int) -> models.Message:
    return db.get(models.Message, mid) or _404()


@app.patch("/api/messages/{mid}")
def edit_message(mid: int, data: MessagePatch, db: Session = Depends(get_db), _=Depends(ANY)):
    m = _msg(db, mid)
    if m.status not in ("brouillon", "valide"):
        raise HTTPException(409, "Message déjà traité")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    m.status, m.approved_by = "brouillon", ""  # toute modification annule la validation
    db.commit()
    return message_out(m)


@app.post("/api/messages/{mid}/approve")
def approve(mid: int, db: Session = Depends(get_db), user=Depends(MANAGER)):
    m = _msg(db, mid)
    if m.status != "brouillon":
        raise HTTPException(409, "Seul un brouillon peut être validé")
    if m.kind != "script_appel" and not (m.company.email or "").strip():
        raise HTTPException(422, "E-mail manquant : complétez la fiche du prospect avant de valider ce message")
    m.status, m.approved_by = "valide", user.email
    db.commit()
    return message_out(m)


@app.post("/api/messages/{mid}/reject")
def reject(mid: int, db: Session = Depends(get_db), _=Depends(ANY)):
    m = _msg(db, mid)
    m.status = "rejete"
    db.commit()
    return message_out(m)


@app.post("/api/messages/{mid}/send")
def send(mid: int, db: Session = Depends(get_db), _=Depends(MANAGER)):
    """N'envoie que les messages VALIDÉS par un humain, jamais à un prospect opposé."""
    m = _msg(db, mid)
    if m.status != "valide":
        raise HTTPException(409, "Le message doit d'abord être validé")
    c = m.company
    if c.do_not_contact and m.kind != "confirmation_stop":
        raise HTTPException(409, "Ce prospect s'est opposé à la prospection")
    if m.kind != "script_appel":
        if not c.email:
            raise HTTPException(422, "Aucune adresse email pour ce prospect")
        if not mailer.smtp_configured():
            raise HTTPException(400, "SMTP non configuré : copiez le message et envoyez-le depuis votre messagerie, "
                                     "puis utilisez « Marquer comme envoyé ».")
        mailer.send_email(c.email, m.subject, m.body)
    m.status, m.sent_at = "envoye", datetime.now(timezone.utc)
    c.last_contact = m.sent_at
    if c.status == "a_contacter":
        c.status = "contacte"
    db.commit()
    return message_out(m)


@app.post("/api/messages/{mid}/mark-sent")
def mark_sent(mid: int, db: Session = Depends(get_db), _=Depends(MANAGER)):
    m = _msg(db, mid)
    if m.status != "valide":
        raise HTTPException(409, "Le message doit d'abord être validé")
    m.status, m.sent_at = "envoye", datetime.now(timezone.utc)
    m.company.last_contact = m.sent_at
    if m.company.status == "a_contacter":
        m.company.status = "contacte"
    db.commit()
    return message_out(m)


# ---------- Pilote automatique ----------
class AutopilotIn(BaseModel):
    enabled: bool | None = None
    daily_cap: int | None = None
    min_score: int | None = None
    hour_start: int | None = None
    hour_end: int | None = None
    weekdays_only: bool | None = None
    auto_relances: bool | None = None


def _autopilot_state(db: Session) -> dict:
    cfg = autopilot.get_cfg(db)
    now = datetime.now(timezone.utc)
    auto_msgs = [m for m in db.scalars(select(models.Message).where(models.Message.approved_by == autopilot.AUTO)
                                       .order_by(models.Message.id.desc()).limit(10))]
    return {"config": cfg, "smtp": mailer.smtp_configured(), "sender": get_settings().smtp_from,
            "sent_today": autopilot.sent_today(db, now),
            "next": [{"id": c.id, "name": c.name, "email": c.email, "score": c.score, "kind": k}
                     for c, k in autopilot.candidates(db, cfg, 5)],
            "recent": [{"company": m.company.name, "kind": m.kind, "status": m.status,
                        "at": m.sent_at.isoformat() if m.sent_at else None} for m in auto_msgs]}


@app.get("/api/autopilot")
def get_autopilot(db: Session = Depends(get_db), _=Depends(MANAGER)):
    return _autopilot_state(db)


@app.put("/api/autopilot")
def put_autopilot(data: AutopilotIn, db: Session = Depends(get_db), _=Depends(ADMIN)):
    ch = data.model_dump(exclude_unset=True)
    cur = autopilot.get_cfg(db) | ch
    if not (1 <= cur["daily_cap"] <= 50):
        raise HTTPException(422, "Plafond quotidien : entre 1 et 50")
    if not (0 <= cur["min_score"] <= 100):
        raise HTTPException(422, "Note minimale : entre 0 et 100")
    if not (0 <= cur["hour_start"] < cur["hour_end"] <= 24):
        raise HTTPException(422, "Horaires invalides")
    if ch.get("enabled") and not mailer.smtp_configured():
        raise HTTPException(409, "Configurez d'abord l'envoi SMTP (adresse d'expédition) dans le fichier .env")
    if ch.get("enabled"):
        ch["failures"], ch["last_error"] = 0, ""
    autopilot.set_cfg(db, **ch)
    return _autopilot_state(db)


# ---------- Export (sauvegarde lisible dans Excel) ----------
@app.get("/api/export/companies.csv")
def export_companies(db: Session = Depends(get_db), _=Depends(MANAGER)):
    cols = ["name", "category", "city", "address", "phone", "email", "website", "contact_name", "score", "status",
            "next_action", "last_contact", "do_not_contact", "source", "notes"]
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow(cols)
    for c in db.scalars(select(models.Company).order_by(models.Company.id)):
        row = company_out(c) | {"address": c.address}
        w.writerow([str(row.get(k, "") if row.get(k) is not None else "").replace("\n", " ") for k in cols])
    return Response(("\ufeff" + buf.getvalue()).encode("utf-8"), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": 'attachment; filename="prospects.csv"'})


# ---------- Appels : la liste du jour et le suivi ----------
CALL_OUTCOMES = {                       # résultat -> (libellé, nouveau statut, prochaine action)
    "no_answer": ("Pas de réponse", None, "Rappeler"),
    "callback": ("À rappeler", None, "Rappeler"),
    "interested": ("Intéressé", "rdv", "Rendez-vous à fixer"),
    "not_interested": ("Pas intéressé", "refuse", ""),
    "wrong_number": ("Numéro erroné", None, "Vérifier le numéro"),
    "whatsapp": ("Message WhatsApp ouvert", None, "Attendre la réponse"),
}


class CallIn(BaseModel):
    outcome: str
    note: str = ""


@app.get("/api/calls")
def call_list(db: Session = Depends(get_db), _=Depends(ANY)):
    """Prospects à appeler : ceux qui ont répondu d'abord, puis jamais contactés (les mieux notés), puis à relancer."""
    now = datetime.now(timezone.utc)
    recent = now - timedelta(days=2)
    out = []
    cands = db.scalars(select(models.Company).where(models.Company.phone != "", models.Company.do_not_contact.is_(False),
                                                    models.Company.status.in_(("a_contacter", "contacte", "repondu"))))
    for c in cands:
        last = aware(c.last_contact)
        if c.status == "contacte" and last and last > recent:
            continue                                             # déjà appelé ou contacté depuis moins de 2 jours
        prio, why = ((0, "A répondu : à rappeler") if c.status == "repondu"
                     else (1, "Jamais contacté") if c.status == "a_contacter"
                     else (2, f"Contacté il y a {(now - last).days} jours" if last else "À relancer"))
        out.append((prio, -(c.score or 0), company_out(c) | {"why": why}))
    return [x[2] for x in sorted(out, key=lambda t: (t[0], t[1]))[:50]]


@app.post("/api/companies/{cid}/call")
def log_call(cid: int, data: CallIn, db: Session = Depends(get_db), user=Depends(ANY)):
    c = db.get(models.Company, cid) or _404()
    if data.outcome not in CALL_OUTCOMES:
        raise HTTPException(422, "Résultat d'appel inconnu")
    label, status, nxt = CALL_OUTCOMES[data.outcome]
    now = datetime.now(timezone.utc)
    _note(c, f"Appel du {now:%d/%m/%Y %H:%M} ({user.name or user.email}) : {label}" + (f" – {data.note.strip()}" if data.note.strip() else ""))
    c.last_contact, c.next_action = now, nxt
    if status:
        c.status = status
    elif c.status == "a_contacter":
        c.status = "contacte"
    db.commit()
    return company_out(c)


# ---------- Relances ----------
def due_relances(db: Session) -> list[dict]:
    return [company_out(c) | {"days": d, "relances_sent": n} for c, d, n in due_companies(db)]


@app.get("/api/relances")
def relances(db: Session = Depends(get_db), _=Depends(ANY)):
    return {"after_days": get_settings().relance_days, "items": due_relances(db)}


@app.post("/api/relances/draft-all")
def draft_all_relances(db: Session = Depends(get_db), _=Depends(MANAGER)):
    """Prépare un brouillon de relance (jamais envoyé automatiquement) pour chaque prospect à relancer."""
    created = 0
    for item in due_relances(db)[:20]:
        c = db.get(models.Company, item["id"])
        subject, body = writer.draft(c, "relance")
        db.add(models.Message(company_id=c.id, kind="relance", subject=subject, body=body))
        created += 1
    db.commit()
    return {"created": created}


# ---------- Rapport ----------
@app.get("/api/report")
def report(days: int = 7, db: Session = Depends(get_db), _=Depends(ANY)):
    days = max(1, min(days, 90))
    since = datetime.now(timezone.utc) - timedelta(days=days)
    companies = list(db.scalars(select(models.Company)))
    messages = list(db.scalars(select(models.Message)))
    by_status: dict[str, int] = {}
    for c in companies:
        by_status[c.status] = by_status.get(c.status, 0) + 1
    new = [c for c in companies if aware(c.created_at) >= since]
    sent = [m for m in messages if m.sent_at and aware(m.sent_at) >= since and m.status == "envoye"]
    top = sorted((c for c in companies if c.status == "a_contacter" and not c.do_not_contact),
                 key=lambda c: -(c.score or 0))[:5]
    return {
        "days": days, "since": since.isoformat(), "garage": get_settings().garage_name,
        "new_prospects": len(new),
        "new_by_category": {k: sum(1 for c in new if c.category == k) for k in {c.category for c in new}},
        "messages_sent": len(sent), "relances_sent": sum(1 for m in sent if m.kind == "relance"),
        "drafts_pending": sum(1 for m in messages if m.status in ("brouillon", "valide")),
        "by_status": by_status, "total": len(companies),
        "to_relance": len(due_relances(db)),
        "top_to_contact": [company_out(c) for c in top],
    }


# ---------- Tableau de bord ----------
@app.get("/api/stats")
def stats(db: Session = Depends(get_db), _=Depends(ANY)):
    by_status = dict(db.execute(select(models.Company.status, func.count()).group_by(models.Company.status)).all())
    by_cat = dict(db.execute(select(models.Company.category, func.count()).group_by(models.Company.category)).all())
    msgs = dict(db.execute(select(models.Message.status, func.count()).group_by(models.Message.status)).all())
    return {"companies": sum(v for k, v in by_status.items() if k != "archive"), "archived": by_status.get("archive", 0),
            "by_status": by_status, "by_category": by_cat,
            "messages": msgs, "to_relance": len(due_relances(db)), "avg_score": db.scalar(select(func.avg(models.Company.score))),
            "sender": get_settings().smtp_from if mailer.smtp_configured() else "",
            "capabilities": {"places": bool(get_settings().places_api_key),
                             "openai": bool(get_settings().openai_api_key),
                             "smtp": mailer.smtp_configured()}}


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


app.mount("/static", StaticFiles(directory=STATIC), name="static")
