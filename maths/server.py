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
  ADMIN_EMAILS          e-mails des administrateurs (séparés par des virgules) : accès à /#/admin
  ABONNEMENTS_ACTIFS    0 pour tout ouvrir à tout le monde ; absent ou autre = seule la démo est gratuite
                        (3 compétences par niveau), le reste demande un abonnement ; les administrateurs ont toujours tout
"""
import os
import re
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta

from flask import Flask, abort, jsonify, redirect, request, send_from_directory, session
from sqlalchemy import func, select
from werkzeug.middleware.proxy_fix import ProxyFix
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
    # Derrière le proxy de Render, sans cela tous les visiteurs auraient la même adresse (celle du proxy)
    # et partageraient la même limite d'essais.
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
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

    def blocked(key, limit, window=300):
        t = time.time()
        q = hits[key]
        while q and q[0] < t - window:
            q.popleft()
        return len(q) >= limit

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
        elif request.path.endswith((".js", ".css", ".html")) or request.path == "/":
            resp.headers["Cache-Control"] = "no-cache"  # le navigateur revérifie : une mise à jour du site s'affiche tout de suite
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
        # par défaut, seule la démo est gratuite ; "0" ouvre tout (période de test)
        return os.environ.get("ABONNEMENTS_ACTIFS", "").strip().lower() not in ("0", "non", "false", "off")

    def is_admin(u):
        admins = {e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()}
        return bool(u) and u["email"].lower() in admins

    def open_for(u):
        """Tout est ouvert si les abonnements sont coupés, ou pour un administrateur connecté."""
        return not paywall_on() or is_admin(u)

    def picks_of(conn, uid):
        return [r[0] for r in conn.execute(select(db.demo_picks.c.skill_id).where(
            db.demo_picks.c.user_id == uid).order_by(db.demo_picks.c.id))]

    def me_payload(conn):
        u = current_user(conn)
        cfg = {"prices": db.PRICES, "free": list(db.FREE_CODES), "demoMax": db.DEMO_MAX, "days": db.PLAN_DAYS,
               "currency": "DA", "payment": payment_mode(), "levels": db.LEVELS,
               "open": open_for(u)}
        if not u:
            return {"user": None, "config": cfg}
        subs = {lv: exp.isoformat() + "Z" for lv, exp in db.active_subscriptions(conn, u["id"]).items()}
        pays = [{"level": r["level"], "amount": r["amount"], "status": r["status"],
                 "date": (r["paid_at"] or r["created_at"]).isoformat() + "Z"}
                for r in conn.execute(select(db.payments).where(db.payments.c.user_id == u["id"])
                                      .order_by(db.payments.c.id.desc()).limit(10)).mappings()]
        ap = active_profile(conn, u["id"])
        cfg["picks"] = picks_of(conn, u["id"])
        return {"user": {"email": u["email"], "admin": is_admin(u)}, "profiles": user_profiles(conn, u["id"]),
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
        d = request.get_json(silent=True) or {}
        email = str(d.get("email", "")).strip().lower()
        ip = request.remote_addr or ""
        # Seuls les échecs comptent : une connexion réussie ne bloque jamais personne.
        k_mail, k_ip = f"login:{ip}:{email}", f"loginip:{ip}"
        if blocked(k_mail, 8) or blocked(k_ip, 40):
            return err("Trop d'essais, réessaie dans quelques minutes.", 429)
        with engine.begin() as conn:
            u = conn.execute(select(db.users).where(db.users.c.email == email)).mappings().first()
            if not u or not check_password_hash(u["pw_hash"], str(d.get("password", ""))):
                hits[k_mail].append(time.time())
                hits[k_ip].append(time.time())
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

    @app.post("/api/demo-pick")
    def demo_pick():
        d = request.get_json(silent=True) or {}
        sid = str(d.get("skill", ""))
        if not SKILL_RE.match(sid):
            return err("Compétence inconnue.")
        with engine.begin() as conn:
            u = current_user(conn)
            if not u:
                return err("Connexion nécessaire.", 401)
            picks = picks_of(conn, u["id"])
            if sid in picks:
                return jsonify(me_payload(conn))
            if len(picks) >= db.DEMO_MAX:
                return err("Tu as déjà choisi tes %d leçons gratuites." % db.DEMO_MAX, 409)
            conn.execute(db.demo_picks.insert().values(user_id=u["id"], skill_id=sid))
            return jsonify(me_payload(conn))

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
            picks = picks_of(conn, u["id"])
            for sid, v in list((d.get("skills") or {}).items())[:600]:
                m = SKILL_RE.match(str(sid))
                if not m or not isinstance(v, dict):
                    continue
                level, code = m.groups()
                if not open_for(u) and sid not in picks and level not in subs and db.FAMILY not in subs:
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
    def plan_label(level):
        return "Famille" if level == db.FAMILY else level.upper()

    @app.post("/api/checkout")
    def checkout():
        d = request.get_json(silent=True) or {}
        level = d.get("level")
        method = d.get("method")
        if level not in db.PRICES:
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
                        f"Tadriss-Maths {plan_label(level)} - 1 mois", [{"payment_id": pay_id, "level": level}], method)
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
        return DEMO_PAGE.format(level=("Famille" if p["level"] == db.FAMILY else p["level"].upper()), amount=p["amount"], cid=cid)

    @app.post("/pay/demo/<cid>/confirm")
    def demo_confirm(cid):
        p = demo_payment(cid)
        # Seul le compte qui a lancé le paiement peut le confirmer.
        if session.get("uid") != p["user_id"]:
            abort(403)
        with engine.begin() as conn:
            db.activate_payment(conn, p["id"])
        return redirect("/#/paiement/succes", 303)

    # ---------- administration ----------
    def admin_user(conn):
        u = current_user(conn)
        return u if is_admin(u) else None

    def iso(d):
        return d.isoformat() + "Z" if d else None

    def user_row(conn, u):
        subs = {lv: iso(exp) for lv, exp in db.active_subscriptions(conn, u["id"]).items()}
        paid = conn.execute(select(func.coalesce(func.sum(db.payments.c.amount), 0)).where(
            (db.payments.c.user_id == u["id"]) & (db.payments.c.status == "paid"))).scalar()
        n = conn.execute(select(func.count()).select_from(db.profiles).where(db.profiles.c.user_id == u["id"])).scalar()
        return {"id": u["id"], "email": u["email"], "created": iso(u["created_at"]), "profiles": n,
                "subscriptions": subs, "paid": int(paid)}

    @app.get("/api/admin/stats")
    def admin_stats():
        with engine.begin() as conn:
            if not admin_user(conn):
                return err("Accès réservé aux administrateurs.", 403)
            t = db.now()
            month = t.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            paid = (db.payments.c.status == "paid")
            return jsonify(
                users=conn.execute(select(func.count()).select_from(db.users)).scalar(),
                subscribers=conn.execute(select(func.count(func.distinct(db.subscriptions.c.user_id)))
                                         .where(db.subscriptions.c.expires_at > t)).scalar(),
                revenue_month=int(conn.execute(select(func.coalesce(func.sum(db.payments.c.amount), 0)).where(
                    paid & (db.payments.c.paid_at >= month))).scalar()),
                revenue_total=int(conn.execute(select(func.coalesce(func.sum(db.payments.c.amount), 0)).where(paid)).scalar()))

    @app.get("/api/admin/users")
    def admin_users():
        q = str(request.args.get("q", "")).strip().lower()[:100]
        with engine.begin() as conn:
            if not admin_user(conn):
                return err("Accès réservé aux administrateurs.", 403)
            stmt = select(db.users).order_by(db.users.c.id.desc()).limit(50)
            if q:
                like = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
                stmt = stmt.where(db.users.c.email.like(like, escape="\\"))
            return jsonify(users=[user_row(conn, u) for u in conn.execute(stmt).mappings()])

    @app.get("/api/admin/users/<int:uid>")
    def admin_user_detail(uid):
        with engine.begin() as conn:
            if not admin_user(conn):
                return err("Accès réservé aux administrateurs.", 403)
            u = conn.execute(select(db.users).where(db.users.c.id == uid)).mappings().first()
            if not u:
                return err("Client introuvable.", 404)
            pays = [{"level": r["level"], "amount": r["amount"], "status": r["status"], "provider": r["provider"],
                     "date": iso(r["paid_at"] or r["created_at"])}
                    for r in conn.execute(select(db.payments).where(db.payments.c.user_id == uid)
                                          .order_by(db.payments.c.id.desc()).limit(30)).mappings()]
            return jsonify(user=user_row(conn, u), payments=pays, profiles=user_profiles(conn, uid),
                           picks=picks_of(conn, uid))

    @app.post("/api/admin/users/<int:uid>/picks")
    def admin_picks(uid):
        """Remet à zéro les leçons gratuites choisies par un client ({"reset": true})."""
        with engine.begin() as conn:
            if not admin_user(conn):
                return err("Accès réservé aux administrateurs.", 403)
            conn.execute(db.demo_picks.delete().where(db.demo_picks.c.user_id == uid))
            return jsonify(ok=True, picks=[])

    @app.post("/api/admin/users/<int:uid>/subscription")
    def admin_subscription(uid):
        """Activer / prolonger ({"plan", "days", "amount"}) ou retirer ({"plan", "remove": true}) un abonnement."""
        d = request.get_json(silent=True) or {}
        plan = d.get("plan")
        if plan not in db.PRICES:
            return err("Niveau inconnu.")
        with engine.begin() as conn:
            admin = admin_user(conn)
            if not admin:
                return err("Accès réservé aux administrateurs.", 403)
            if not conn.execute(select(db.users.c.id).where(db.users.c.id == uid)).first():
                return err("Client introuvable.", 404)
            if d.get("remove"):
                conn.execute(db.subscriptions.delete().where(
                    (db.subscriptions.c.user_id == uid) & (db.subscriptions.c.level == plan)))
                app.logger.info("admin %s retire %s de %s", admin["email"], plan, uid)
            else:
                try:
                    days, amount = int(d.get("days", db.PLAN_DAYS)), int(d.get("amount") or 0)
                except (TypeError, ValueError):
                    return err("Nombre de jours ou montant invalide.")
                if not 1 <= days <= 366 or not 0 <= amount <= 100000:
                    return err("Nombre de jours ou montant invalide.")
                db.grant(conn, uid, plan, days)
                if amount:  # paiement en espèces : gardé dans l'historique et dans les revenus
                    conn.execute(db.payments.insert().values(
                        user_id=uid, level=plan, amount=amount, currency="dzd", provider="manuel",
                        status="paid", created_at=db.now(), paid_at=db.now()))
                app.logger.info("admin %s accorde %s jours de %s à %s", admin["email"], days, plan, uid)
            u = conn.execute(select(db.users).where(db.users.c.id == uid)).mappings().first()
            return jsonify(user=user_row(conn, u))

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
