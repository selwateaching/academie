"""Serveur de Tadriss-Maths : site statique + comptes, abonnements, paiements, progression.

Local :   python3 server.py          (SQLite, paiements simulés)
Render :  gunicorn server:app        (PostgreSQL via DATABASE_URL, voir render.yaml)

Variables d'environnement :
  SECRET_KEY            clé secrète des sessions (obligatoire en production)
  DATABASE_URL          base PostgreSQL (fournie par Render)
  BASE_URL              adresse publique du site, ex. https://tadriss-maths.onrender.com
  PAYMENT_MODE          demo (paiement simulé) ou chargily
  CHARGILY_SECRET_KEY   clé secrète Chargily (clé de TEST tant que CHARGILY_MODE=test)
  CHARGILY_MODE         test (par défaut) ou live
  ABONNEMENTS_ACTIFS    1 pour réserver les compétences payantes aux abonnés ; absent = tout est ouvert
"""
import os
import re
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime

from flask import Flask, abort, jsonify, redirect, request, send_from_directory, session
from sqlalchemy import select
from werkzeug.security import check_password_hash, generate_password_hash

import chargily
import store as db

ROOT = os.path.dirname(os.path.abspath(__file__))
EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,}$")
SKILL_RE = re.compile(r"^(gs|cp|ce1|ce2|cm1|cm2|6e)-([A-Z]{1,2}\d{1,2})$")
DAY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX_PROFILES = 5


def create_app(database_url=None):
    app = Flask(__name__, static_folder=None)
    secret = os.environ.get("SECRET_KEY")
    if not secret:
        secret = secrets.token_hex(32)  # sessions perdues à chaque redémarrage : à définir en production
        print("ATTENTION : SECRET_KEY absente, clé temporaire utilisée.")
    app.config.update(
        SECRET_KEY=secret,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("BASE_URL", "").startswith("https://"),
        PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 30,
        MAX_CONTENT_LENGTH=256 * 1024,
    )
    engine = db.make_engine(database_url)
    app.engine = engine
    hits = defaultdict(deque)

    def too_many(key, limit=10, window=300):
        t = time.time()
        q = hits[key]
        while q and q[0] < t - window:
            q.popleft()
        if len(q) >= limit:
            return True
        q.append(t)
        return False

    def base_url():
        return (os.environ.get("BASE_URL") or request.host_url).rstrip("/")

    def payment_mode():
        return "chargily" if os.environ.get("PAYMENT_MODE", "demo") == "chargily" else "demo"

    def err(msg, code=400):
        return jsonify(error=msg), code

    @app.before_request
    def csrf_guard():
        # Les requêtes JSON de l'application portent un en-tête personnalisé : un autre site ne peut pas l'envoyer.
        if request.method in ("POST", "PUT", "DELETE") and request.path.startswith("/api/") \
                and request.path != "/api/webhook/chargily":
            if request.headers.get("X-Tadriss") != "1":
                return err("requête refusée", 403)

    @app.after_request
    def headers(resp):
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Referrer-Policy"] = "same-origin"
        if request.path.startswith("/api/"):
            resp.headers["Cache-Control"] = "no-store"
        return resp

    # ---------- session ----------
    def current_user(conn):
        uid = session.get("uid")
        if not uid:
            return None
        return conn.execute(select(db.users).where(db.users.c.id == uid)).mappings().first()

    def user_profiles(conn, uid):
        return [dict(r) for r in conn.execute(select(db.profiles.c.id, db.profiles.c.name, db.profiles.c.level)
                                              .where(db.profiles.c.user_id == uid).order_by(db.profiles.c.id)).mappings()]

    def active_profile(conn, uid):
        plist = user_profiles(conn, uid)
        pid = session.get("pid")
        for p in plist:
            if p["id"] == pid:
                return p
        if plist:
            session["pid"] = plist[0]["id"]
            return plist[0]
        return None

    def paywall_on():
        return os.environ.get("ABONNEMENTS_ACTIFS", "").strip().lower() in ("1", "oui", "true")

    def can_access(conn, uid, skill_id):
        m = SKILL_RE.match(skill_id or "")
        if not m:
            return False
        level, code = m.groups()
        if code in db.FREE_CODES or not paywall_on():
            return True
        return bool(uid) and level in db.active_subscriptions(conn, uid)

    def me_payload(conn):
        u = current_user(conn)
        cfg = {"prices": db.PRICES, "free": list(db.FREE_CODES), "days": db.PLAN_DAYS,
               "currency": "DA", "payment": payment_mode(), "levels": db.LEVELS,
               "open": not paywall_on()}
        if not u:
            return {"user": None, "config": cfg}
        subs = {lv: exp.isoformat() + "Z" for lv, exp in db.active_subscriptions(conn, u["id"]).items()}
        pays = [{"level": r["level"], "amount": r["amount"], "status": r["status"],
                 "date": (r["paid_at"] or r["created_at"]).isoformat() + "Z"}
                for r in conn.execute(select(db.payments).where(db.payments.c.user_id == u["id"])
                                      .order_by(db.payments.c.id.desc()).limit(10)).mappings()]
        ap = active_profile(conn, u["id"])
        return {"user": {"email": u["email"]}, "profiles": user_profiles(conn, u["id"]),
                "activeProfile": ap["id"] if ap else None, "subscriptions": subs, "payments": pays, "config": cfg}

    # ---------- comptes ----------
    @app.post("/api/register")
    def register():
        if too_many("reg:" + (request.remote_addr or "")):
            return err("Trop d'essais, réessaie dans quelques minutes.", 429)
        d = request.get_json(silent=True) or {}
        email = str(d.get("email", "")).strip().lower()
        password = str(d.get("password", ""))
        name = str(d.get("name", "")).strip()[:40]
        level = d.get("level") if d.get("level") in db.LEVELS else "cm1"
        if not EMAIL_RE.match(email):
            return err("Adresse e-mail invalide.")
        if len(password) < 8:
            return err("Le mot de passe doit avoir au moins 8 caractères.")
        if not name:
            return err("Indique le prénom de l'élève.")
        with engine.begin() as conn:
            if conn.execute(select(db.users.c.id).where(db.users.c.email == email)).first():
                return err("Un compte existe déjà avec cette adresse.", 409)
            uid = conn.execute(db.users.insert().values(email=email, pw_hash=generate_password_hash(password),
                                                        created_at=db.now())).inserted_primary_key[0]
            pid = conn.execute(db.profiles.insert().values(user_id=uid, name=name, level=level,
                                                           created_at=db.now())).inserted_primary_key[0]
            session.clear()
            session.permanent = True
            session["uid"], session["pid"] = uid, pid
            return jsonify(me_payload(conn))

    @app.post("/api/login")
    def login():
        if too_many("login:" + (request.remote_addr or "")):
            return err("Trop d'essais, réessaie dans quelques minutes.", 429)
        d = request.get_json(silent=True) or {}
        email = str(d.get("email", "")).strip().lower()
        with engine.begin() as conn:
            u = conn.execute(select(db.users).where(db.users.c.email == email)).mappings().first()
            if not u or not check_password_hash(u["pw_hash"], str(d.get("password", ""))):
                return err("E-mail ou mot de passe incorrect.", 401)
            session.clear()
            session.permanent = True
            session["uid"] = u["id"]
            return jsonify(me_payload(conn))

    @app.post("/api/logout")
    def logout():
        session.clear()
        return jsonify(ok=True)

    @app.get("/api/me")
    def me():
        with engine.begin() as conn:
            return jsonify(me_payload(conn))

    @app.post("/api/profiles")
    def add_profile():
        d = request.get_json(silent=True) or {}
        name = str(d.get("name", "")).strip()[:40]
        level = d.get("level") if d.get("level") in db.LEVELS else "cm1"
        with engine.begin() as conn:
            u = current_user(conn)
            if not u:
                return err("Connexion nécessaire.", 401)
            if not name:
                return err("Indique un prénom.")
            if len(user_profiles(conn, u["id"])) >= MAX_PROFILES:
                return err(f"Maximum {MAX_PROFILES} profils par compte.")
            pid = conn.execute(db.profiles.insert().values(user_id=u["id"], name=name, level=level,
                                                           created_at=db.now())).inserted_primary_key[0]
            session["pid"] = pid
            return jsonify(me_payload(conn))

    @app.post("/api/profiles/<int:pid>/select")
    def select_profile(pid):
        with engine.begin() as conn:
            u = current_user(conn)
            if not u:
                return err("Connexion nécessaire.", 401)
            if pid not in [p["id"] for p in user_profiles(conn, u["id"])]:
                return err("Profil introuvable.", 404)
            session["pid"] = pid
            return jsonify(me_payload(conn))

    @app.delete("/api/profiles/<int:pid>")
    def delete_profile(pid):
        with engine.begin() as conn:
            u = current_user(conn)
            if not u:
                return err("Connexion nécessaire.", 401)
            plist = user_profiles(conn, u["id"])
            if pid not in [p["id"] for p in plist]:
                return err("Profil introuvable.", 404)
            if len(plist) <= 1:
                return err("Un compte garde au moins un profil.")
            conn.execute(db.progress.delete().where(db.progress.c.profile_id == pid))
            conn.execute(db.daily.delete().where(db.daily.c.profile_id == pid))
            conn.execute(db.profiles.delete().where(db.profiles.c.id == pid))
            if session.get("pid") == pid:
                session.pop("pid", None)
            return jsonify(me_payload(conn))

    # ---------- progression ----------
    @app.get("/api/progress")
    def get_progress():
        with engine.begin() as conn:
            u = current_user(conn)
            ap = active_profile(conn, u["id"]) if u else None
            if not ap:
                return err("Connexion nécessaire.", 401)
            skills = {r["skill_id"]: {"score": r["score"], "answered": r["answered"], "correct": r["correct"],
                                      "secs": r["secs"], "last": r["last_ts"]}
                      for r in conn.execute(select(db.progress).where(db.progress.c.profile_id == ap["id"])).mappings()}
            days = {r["day"]: {"n": r["n"], "ok": r["ok"], "secs": r["secs"]}
                    for r in conn.execute(select(db.daily).where(db.daily.c.profile_id == ap["id"])).mappings()}
            return jsonify(skills=skills, days=days)

    def clamp(v, hi):
        try:
            return max(0, min(int(v), hi))
        except (TypeError, ValueError):
            return 0

    @app.post("/api/progress")
    def save_progress():
        d = request.get_json(silent=True) or {}
        with engine.begin() as conn:
            u = current_user(conn)
            ap = active_profile(conn, u["id"]) if u else None
            if not ap:
                return err("Connexion nécessaire.", 401)
            pid, saved, refused = ap["id"], 0, []
            subs = db.active_subscriptions(conn, u["id"])
            for sid, v in list((d.get("skills") or {}).items())[:600]:
                m = SKILL_RE.match(str(sid))
                if not m or not isinstance(v, dict):
                    continue
                level, code = m.groups()
                if paywall_on() and code not in db.FREE_CODES and level not in subs:
                    refused.append(sid)
                    continue
                vals = dict(score=clamp(v.get("score"), 100), answered=clamp(v.get("answered"), 10**6),
                            correct=clamp(v.get("correct"), 10**6), secs=clamp(v.get("secs"), 10**8),
                            last_ts=clamp(v.get("last"), 10**13))
                cur = conn.execute(select(db.progress.c.skill_id).where(
                    (db.progress.c.profile_id == pid) & (db.progress.c.skill_id == sid))).first()
                if cur:
                    conn.execute(db.progress.update().where(
                        (db.progress.c.profile_id == pid) & (db.progress.c.skill_id == sid)).values(**vals))
                else:
                    conn.execute(db.progress.insert().values(profile_id=pid, skill_id=sid, **vals))
                saved += 1
            for day, v in list((d.get("days") or {}).items())[:400]:
                if not DAY_RE.match(str(day)) or not isinstance(v, dict):
                    continue
                vals = dict(n=clamp(v.get("n"), 10**6), ok=clamp(v.get("ok"), 10**6), secs=clamp(v.get("secs"), 10**8))
                cur = conn.execute(select(db.daily.c.day).where(
                    (db.daily.c.profile_id == pid) & (db.daily.c.day == day))).first()
                if cur:
                    conn.execute(db.daily.update().where(
                        (db.daily.c.profile_id == pid) & (db.daily.c.day == day)).values(**vals))
                else:
                    conn.execute(db.daily.insert().values(profile_id=pid, day=day, **vals))
            return jsonify(saved=saved, refused=refused)

    # ---------- paiements ----------
    @app.post("/api/checkout")
    def checkout():
        d = request.get_json(silent=True) or {}
        level = d.get("level")
        method = d.get("method")
        if level not in db.LEVELS:
            return err("Niveau inconnu.")
        amount = db.PRICES[level]
        with engine.begin() as conn:
            u = current_user(conn)
            if not u:
                return err("Connexion nécessaire.", 401)
            mode = payment_mode()
            pay_id = conn.execute(db.payments.insert().values(
                user_id=u["id"], level=level, amount=amount, currency="dzd", provider=mode,
                status="pending", created_at=db.now())).inserted_primary_key[0]
            try:
                if mode == "chargily":
                    c = chargily.create_checkout(
                        amount, base_url() + "/#/paiement/succes", base_url() + "/#/paiement/echec",
                        base_url() + "/api/webhook/chargily",
                        f"Tadriss-Maths {level.upper()} - 1 mois", [{"payment_id": pay_id, "level": level}], method)
                    cid, url = c["id"], c["url"]
                else:
                    cid = "demo_" + secrets.token_urlsafe(16)
                    url = f"{base_url()}/pay/demo/{cid}"
            except Exception as e:  # noqa: BLE001
                conn.execute(db.payments.update().where(db.payments.c.id == pay_id).values(status="failed"))
                app.logger.error("checkout: %s", e)
                return err("Le paiement est momentanément indisponible.", 502)
            conn.execute(db.payments.update().where(db.payments.c.id == pay_id).values(checkout_id=cid))
            return jsonify(url=url)

    def settle(conn, checkout_id):
        """Vérifie un paiement auprès du fournisseur puis active l'abonnement."""
        p = conn.execute(select(db.payments).where(db.payments.c.checkout_id == checkout_id)).mappings().first()
        if not p:
            return None
        if p["status"] == "paid":
            return "paid"
        if p["provider"] == "chargily":
            try:
                status = str(chargily.get_checkout(checkout_id).get("status", ""))
            except Exception as e:  # noqa: BLE001
                app.logger.error("get_checkout: %s", e)
                return p["status"]
            if status == "paid":
                db.activate_payment(conn, p["id"])
                return "paid"
            if status in ("failed", "canceled", "expired"):
                conn.execute(db.payments.update().where(db.payments.c.id == p["id"]).values(status="failed"))
                return "failed"
        return p["status"]

    @app.post("/api/payments/refresh")
    def refresh_payments():
        """Appelé au retour du paiement : revérifie les paiements en attente du compte."""
        with engine.begin() as conn:
            u = current_user(conn)
            if not u:
                return err("Connexion nécessaire.", 401)
            for r in conn.execute(select(db.payments.c.checkout_id).where(
                    (db.payments.c.user_id == u["id"]) & (db.payments.c.status == "pending")
                    & (db.payments.c.provider == "chargily"))).all():
                if r[0]:
                    settle(conn, r[0])
            return jsonify(me_payload(conn))

    @app.post("/api/webhook/chargily")
    def webhook():
        raw = request.get_data()
        if not chargily.valid_signature(raw, request.headers.get("signature", "")):
            return err("signature invalide", 403)
        event = request.get_json(silent=True) or {}
        cid = (event.get("data") or {}).get("id")
        if not cid:
            return jsonify(ok=True)
        with engine.begin() as conn:
            settle(conn, str(cid))
        return jsonify(ok=True)

    # Simulateur de paiement (PAYMENT_MODE=demo) : aucun argent, aucune clé.
    DEMO_PAGE = """<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Paiement de démonstration</title>
<body style="font-family:system-ui,sans-serif;max-width:460px;margin:12vh auto;padding:0 18px;color:#1f1d3d">
<h1 style="font-size:1.4rem">Paiement de démonstration</h1>
<p>Mode test : aucun vrai paiement n'est effectué. Abonnement <b>{level}</b>, <b>{amount} DA</b> pour 30 jours.</p>
<form method="post" action="/pay/demo/{cid}/confirm"><button style="font:inherit;font-weight:700;padding:12px 20px;border:0;border-radius:12px;background:#3b3a8f;color:#fff;cursor:pointer">Simuler un paiement réussi</button></form>
<p><a href="/#/paiement/echec">Annuler</a></p></body>"""

    def demo_payment(cid):
        if payment_mode() != "demo" or not cid.startswith("demo_"):
            abort(404)
        with engine.begin() as conn:
            p = conn.execute(select(db.payments).where(db.payments.c.checkout_id == cid)).mappings().first()
        if not p or p["provider"] != "demo":
            abort(404)
        return p

    @app.get("/pay/demo/<cid>")
    def demo_page(cid):
        p = demo_payment(cid)
        return DEMO_PAGE.format(level=p["level"].upper(), amount=p["amount"], cid=cid)

    @app.post("/pay/demo/<cid>/confirm")
    def demo_confirm(cid):
        p = demo_payment(cid)
        # Seul le compte qui a lancé le paiement peut le confirmer.
        if session.get("uid") != p["user_id"]:
            abort(403)
        with engine.begin() as conn:
            db.activate_payment(conn, p["id"])
        return redirect("/#/paiement/succes", 303)

    # ---------- site ----------
    @app.get("/healthz")
    def healthz():
        return "ok"

    @app.get("/")
    def index():
        return send_from_directory(ROOT, "index.html")

    @app.get("/css/<path:name>")
    def css(name):
        return send_from_directory(os.path.join(ROOT, "css"), name)

    @app.get("/js/<path:name>")
    def js(name):
        return send_from_directory(os.path.join(ROOT, "js"), name)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
