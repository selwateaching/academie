"""Application Flask : pages, API publique, authentification, médias."""

import os
import secrets
import threading
import time
from datetime import date, datetime

from flask import (Flask, abort, jsonify, redirect, render_template, request, send_from_directory,
                   session, url_for, Response)
from werkzeug.security import check_password_hash, generate_password_hash

import core
import db
import engine
import notify
import pdfdoc
import web
from db import jload, row, rows

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def _secret():
    env = os.environ.get("INSTITUT_SECRET")
    if env:
        return env
    path = os.path.join(db.INSTANCE_DIR, "secret.key")
    os.makedirs(db.INSTANCE_DIR, exist_ok=True)
    if not os.path.exists(path):
        with open(path, "w") as fh:
            fh.write(secrets.token_hex(32))
        os.chmod(path, 0o600)
    return open(path).read().strip()


def bootstrap():
    """Crée la base, les données initiales et le compte professionnel au premier lancement."""
    conn = db.connect()
    db.init_db(conn)
    if not conn.execute("SELECT 1 FROM users LIMIT 1").fetchone():
        import seed
        email = os.environ.get("INSTITUT_ADMIN_EMAIL", "pro@institut.local")
        password = os.environ.get("INSTITUT_ADMIN_PASSWORD")
        generated = False
        if not password:
            password, generated = secrets.token_urlsafe(9), True
        seed.seed_all(conn, email, generate_password_hash(password))
        if os.environ.get("INSTITUT_SEED_DEMO", "1") == "1":
            seed.seed_demo(conn)
            seed.seed_demo_diagnostic(conn)
            conn.execute("UPDATE outbox SET status='cancelled' WHERE status='pending' AND send_at<?", (db.now_iso(),))
            conn.commit()
        print(f"\n=== Compte professionnelle créé : {email}" + (f" / mot de passe : {password}" if generated else "") + " ===\n", flush=True)
    conn.close()


def _outbox_worker(app):
    def loop():
        while True:
            try:
                conn = db.connect()
                notify.process_outbox(conn)
                conn.close()
            except Exception as exc:  # noqa: BLE001
                app.logger.warning("outbox: %s", exc)
            time.sleep(60)
    threading.Thread(target=loop, daemon=True).start()


def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")
    app.secret_key = _secret()
    app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax",
                      SESSION_COOKIE_SECURE=os.environ.get("INSTITUT_HTTPS", "0") == "1",
                      MAX_CONTENT_LENGTH=40 * 1024 * 1024, JSON_AS_ASCII=False)
    app.json.ensure_ascii = False
    bootstrap()
    app.teardown_appcontext(web.close_db)

    @app.before_request
    def csrf_guard():
        # Les appels qui modifient l'état exigent un en-tête personnalisé (impossible depuis un formulaire tiers).
        if request.method in ("POST", "PUT", "PATCH", "DELETE") and request.path.startswith("/api/"):
            if request.headers.get("X-Requested-With") != "institut":
                abort(403, "Requête refusée.")

    @app.after_request
    def headers(resp):
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("Referrer-Policy", "same-origin")
        resp.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        if request.path.startswith("/api/"):
            resp.headers["Cache-Control"] = "no-store"
        return resp

    @app.errorhandler(Exception)
    def on_error(exc):
        from werkzeug.exceptions import HTTPException
        if isinstance(exc, HTTPException):
            if request.path.startswith("/api/"):
                return jsonify(error=exc.description), exc.code
            return exc
        if isinstance(exc, core.BookingError):
            return jsonify(error=str(exc)), 409
        if isinstance(exc, ValueError) and request.path.startswith("/api/"):
            return jsonify(error=str(exc)), 400
        app.logger.exception("Erreur serveur")
        return (jsonify(error="Une erreur est survenue."), 500) if request.path.startswith("/api/") else ("Erreur", 500)

    # ---------------------------------------------------------------- pages
    def brand():
        conn = web.get_db()
        return {"inst": core.setting(conn, "institute", {}), "marketing": core.setting(conn, "marketing", {})}

    @app.route("/")
    def landing():
        conn = web.get_db()
        services = rows(conn, "SELECT * FROM services WHERE active=1 AND online_bookable=1 ORDER BY position, id")
        cats = {}
        for s in services:
            cats.setdefault(s["category"], []).append(s)
        reviews = rows(conn, "SELECT r.*, sv.name AS service FROM reviews r LEFT JOIN services sv ON sv.id=r.service_id WHERE r.status='published' ORDER BY r.id DESC LIMIT 6")
        stat = row(conn, "SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE status='published'")
        return render_template("landing.html", cats=cats, loyalty=core.setting(conn, "loyalty", {}),
                               hours=core.setting(conn, "opening_hours", {}), reviews=reviews,
                               rating={"n": stat["n"], "avg": round(stat["avg"], 1) if stat["avg"] else None}, **brand())

    @app.route("/reserver")
    @app.route("/compte")
    def client_app():
        return render_template("espace.html", **brand())

    @app.route("/admin")
    def admin_app():
        return render_template("admin.html", **brand())

    @app.route("/devis/<token>")
    def public_quote(token):
        conn = web.get_db()
        q = row(conn, "SELECT * FROM quotes WHERE token=?", (token,))
        if not q:
            abort(404)
        quote = core.quote_out(q)
        client = row(conn, "SELECT first_name,last_name FROM users WHERE id=?", (q["client_id"],))
        return render_template("quote_public.html", q=quote, client=client, disclaimer=engine.DISCLAIMER, **brand())

    @app.route("/media/public/<path:name>")
    def media_public(name):
        return send_from_directory(os.path.join(db.UPLOAD_DIR, "public"), name, max_age=3600)

    @app.route("/media/private/<path:name>")
    @web.login_required
    def media_private(name):
        u = web.current_user()
        conn = web.get_db()
        if u["role"] != "pro":
            like = f'%"{name}"%'
            ok = row(conn, "SELECT 1 AS x FROM submissions WHERE client_id=? AND photos LIKE ?", (u["id"], like)) or \
                row(conn, "SELECT 1 AS x FROM ba_photos WHERE client_id=? AND file=?", (u["id"], name))
            if not ok:
                abort(404)
        resp = send_from_directory(os.path.join(db.UPLOAD_DIR, "private"), name)
        resp.headers["Cache-Control"] = "private, max-age=600"
        return resp

    @app.route("/media/gallery/<int:pid>")
    def media_gallery(pid):
        """Photos avant/après utilisables en marketing : uniquement avec consentement de la cliente."""
        conn = web.get_db()
        p = row(conn, "SELECT b.file FROM ba_photos b JOIN users u ON u.id=b.client_id WHERE b.id=? AND b.marketing_ok=1 AND u.consent_photos=1", (pid,))
        if not p:
            abort(404)
        return send_from_directory(os.path.join(db.UPLOAD_DIR, "private"), p["file"])

    @app.route("/healthz")
    def healthz():
        return "ok"

    # ------------------------------------------------------------ API publique
    @app.get("/api/public/info")
    def api_info():
        conn = web.get_db()
        return jsonify(institute=core.setting(conn, "institute", {}), marketing=core.setting(conn, "marketing", {}),
                       hours=core.setting(conn, "opening_hours", {}), loyalty=core.setting(conn, "loyalty", {}),
                       booking=core.setting(conn, "booking", {}),
                       payment_provider=os.environ.get("INSTITUT_PAYMENT", "demo"))

    @app.get("/api/public/services")
    def api_services():
        conn = web.get_db()
        out = rows(conn, "SELECT s.*, d.slug AS diagnostic_slug, d.name AS diagnostic_name FROM services s "
                         "LEFT JOIN diagnostics d ON d.id=s.diagnostic_id AND d.active=1 "
                         "WHERE s.active=1 AND s.online_bookable=1 ORDER BY s.position, s.id")
        return jsonify(services=out)

    @app.get("/api/public/reviews")
    def api_reviews():
        conn = web.get_db()
        out = rows(conn, "SELECT r.id, r.rating, r.text, r.display_name, r.created_at, sv.name AS service FROM reviews r "
                         "LEFT JOIN services sv ON sv.id=r.service_id WHERE r.status='published' ORDER BY r.id DESC LIMIT 50")
        return jsonify(reviews=out)

    @app.get("/api/public/diagnostics/<slug>")
    def api_diag(slug):
        d = core.load_diagnostic(web.get_db(), slug=slug)
        if not d:
            abort(404, "Diagnostic introuvable.")
        return jsonify(slug=d["slug"], name=d["name"], intro=d["intro"], questions=d["questions"],
                       photo_slots=d["photo_slots"], disclaimer=engine.DISCLAIMER)

    @app.post("/api/public/diagnostics/<slug>/evaluate")
    def api_diag_eval(slug):
        conn = web.get_db()
        d = core.load_diagnostic(conn, slug=slug)
        if not d:
            abort(404, "Diagnostic introuvable.")
        data = web.body()
        answers = core.sanitize_answers(d, data.get("answers") or {})
        missing = engine.missing_required(d, answers)
        if missing:
            return jsonify(error="Merci de répondre à toutes les questions obligatoires.", missing=missing), 400
        svc = row(conn, "SELECT * FROM services WHERE id=? AND active=1", (data.get("service_id"),)) if data.get("service_id") else None
        return jsonify(result=core.run_diagnostic(conn, d, answers, svc))

    @app.get("/api/public/availability")
    def api_availability():
        conn = web.get_db()
        svc = row(conn, "SELECT * FROM services WHERE id=? AND active=1 AND online_bookable=1", (request.args.get("service_id"),))
        if not svc:
            abort(404, "Prestation introuvable.")
        try:
            start = date.fromisoformat(request.args.get("from") or date.today().isoformat())
            days = max(1, min(42, int(request.args.get("days", 14))))
        except ValueError:
            abort(400, "Paramètres invalides.")
        start = max(start, date.today())
        return jsonify(days=core.availability(conn, svc, start, days))

    def _quote_pdf_response(conn, q):
        quote = core.quote_out(q)
        client = row(conn, "SELECT * FROM users WHERE id=?", (q["client_id"],))
        extra = {"disclaimer": engine.DISCLAIMER}
        if q["submission_id"]:
            sub = row(conn, "SELECT s.result, sv.name FROM submissions s LEFT JOIN services sv ON sv.id=s.service_id WHERE s.id=?", (q["submission_id"],))
            res = jload(sub["result"], {})
            extra.update(service=sub["name"], result_title=res.get("title"), alerts=res.get("alerts", []))
        data = pdfdoc.build("quote", quote, client, core.setting(conn, "institute", {}), extra)
        return Response(data, mimetype="application/pdf",
                        headers={"Content-Disposition": f'inline; filename="{q["number"]}.pdf"'})

    app.quote_pdf = _quote_pdf_response

    @app.get("/api/public/quotes/<token>.pdf")
    def api_public_quote_pdf(token):
        conn = web.get_db()
        q = row(conn, "SELECT * FROM quotes WHERE token=?", (token,))
        if not q:
            abort(404)
        return _quote_pdf_response(conn, q)

    @app.post("/api/public/quotes/<token>/<action>")
    def api_public_quote_action(token, action):
        conn = web.get_db()
        q = row(conn, "SELECT * FROM quotes WHERE token=?", (token,))
        if not q or action not in ("accept", "refuse"):
            abort(404)
        out = _answer_quote(conn, q, action)
        return jsonify(quote=out)

    def _answer_quote(conn, q, action):
        quote = core.quote_out(q)
        if quote["expired"]:
            abort(409, "Ce devis a expiré. Contactez l'institut pour en obtenir un nouveau.")
        if q["status"] not in ("draft", "sent", "accepted", "refused"):
            abort(409, "Ce devis ne peut plus être modifié.")
        status = "accepted" if action == "accept" else "refused"
        conn.execute("UPDATE quotes SET status=?, answered_at=? WHERE id=?", (status, db.now_iso(), q["id"]))
        conn.commit()
        return core.quote_out(row(conn, "SELECT * FROM quotes WHERE id=?", (q["id"],)))

    app.answer_quote = _answer_quote

    # ------------------------------------------------------------ authentification
    @app.post("/api/auth/register")
    def api_register():
        conn = web.get_db()
        d = web.body()
        web.need(d, "email", "password", "first_name", "last_name")
        email = web.clean(d["email"], 200).lower()
        if not web.valid_email(email):
            abort(400, "Adresse email invalide.")
        if len(d["password"]) < 8:
            abort(400, "Le mot de passe doit contenir au moins 8 caractères.")
        if not d.get("consent_data"):
            abort(400, "Votre accord sur le traitement de vos données est nécessaire pour créer un compte.")
        web.throttle(f"reg:{request.remote_addr}", 10, 3600)
        if row(conn, "SELECT 1 AS x FROM users WHERE email=?", (email,)):
            abort(409, "Un compte existe déjà avec cet email. Connectez-vous.")
        cur = conn.execute(
            "INSERT INTO users(role,email,pw_hash,first_name,last_name,phone,consent_data,consent_marketing,consent_photos,created_at) VALUES ('client',?,?,?,?,?,1,?,?,?)",
            (email, generate_password_hash(d["password"]), web.clean(d["first_name"], 80), web.clean(d["last_name"], 80),
             web.clean(d.get("phone"), 30), int(bool(d.get("consent_marketing"))), int(bool(d.get("consent_photos"))), db.now_iso()))
        conn.commit()
        session.clear()
        session["uid"] = cur.lastrowid
        session.permanent = True
        return jsonify(user=web.public_user(row(conn, "SELECT * FROM users WHERE id=?", (cur.lastrowid,)))), 201

    @app.post("/api/auth/login")
    def api_login():
        conn = web.get_db()
        d = web.body()
        email = web.clean(d.get("email"), 200).lower()
        web.throttle(f"login:{request.remote_addr}:{email}")
        u = row(conn, "SELECT * FROM users WHERE email=? AND deleted=0", (email,))
        if not u or not u["pw_hash"] or not check_password_hash(u["pw_hash"], d.get("password") or ""):
            abort(401, "Email ou mot de passe incorrect.")
        session.clear()
        session["uid"] = u["id"]
        session.permanent = True
        web._attempts.pop(f"login:{request.remote_addr}:{email}", None)
        return jsonify(user=web.public_user(u))

    @app.post("/api/auth/logout")
    def api_logout():
        session.clear()
        return jsonify(ok=True)

    @app.get("/api/auth/me")
    def api_me():
        return jsonify(user=web.public_user(web.current_user()))

    import client_api
    import admin_api
    client_api.register(app)
    admin_api.register(app)
    if os.environ.get("INSTITUT_NO_WORKER") != "1":
        _outbox_worker(app)
    return app


app = None


def get_app():
    global app
    if app is None:
        app = create_app()
    return app


if __name__ == "__main__":
    get_app().run(host="0.0.0.0", port=int(os.environ.get("PORT", "5050")), debug=False)
