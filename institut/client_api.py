"""API de l'espace cliente."""

import os
from datetime import datetime, timedelta

from flask import abort, jsonify, request, Response
from werkzeug.security import check_password_hash, generate_password_hash

import core
import db
import engine
import notify
import pdfdoc
import web
from db import jdump, jload, row, rows

PAYMENT_PROVIDER = os.environ.get("INSTITUT_PAYMENT", "demo")


def appt_out(conn, a):
    svc = row(conn, "SELECT name,category,duration,photo FROM services WHERE id=?", (a["service_id"],))
    a = dict(a)
    a.update(service_name=svc["name"], service_category=svc["category"], duration=svc["duration"],
             status_label=core.STATUS_LABELS.get(a["status"], a["status"]))
    return a


def register(app):
    @app.get("/api/client/overview")
    @web.login_required
    def c_overview():
        conn, u = web.get_db(), web.current_user()
        now = db.now_iso()
        nxt = rows(conn, "SELECT * FROM appointments WHERE client_id=? AND start>=? AND status IN (%s) ORDER BY start LIMIT 5" %
                   ",".join("?" * len(core.ACTIVE_FUTURE)), (u["id"], now, *core.ACTIVE_FUTURE))
        quotes = [core.quote_out(q) for q in rows(conn, "SELECT * FROM quotes WHERE client_id=? AND status IN ('draft','sent','accepted') ORDER BY id DESC", (u["id"],))]
        loy = core.setting(conn, "loyalty", {})
        return jsonify(user=web.public_user(u), next=[appt_out(conn, a) for a in nxt],
                       quotes=[q for q in quotes if not q["expired"]], loyalty=loy,
                       reminders=rows(conn, "SELECT kind,subject,send_at,status FROM outbox WHERE client_id=? AND status='pending' ORDER BY send_at LIMIT 5", (u["id"],)))

    @app.get("/api/client/appointments")
    @web.login_required
    def c_appointments():
        conn, u = web.get_db(), web.current_user()
        return jsonify(appointments=[appt_out(conn, a) for a in rows(conn, "SELECT * FROM appointments WHERE client_id=? ORDER BY start DESC", (u["id"],))],
                       cancel_hours=core.setting(conn, "booking", {}).get("cancel_hours", 24))

    def _own_appt(conn, u, aid):
        a = row(conn, "SELECT * FROM appointments WHERE id=? AND client_id=?", (aid, u["id"]))
        if not a:
            abort(404, "Rendez-vous introuvable.")
        return a

    def _within_policy(conn, a):
        hours = core.setting(conn, "booking", {}).get("cancel_hours", 24)
        return core.dt(a["start"]) - datetime.now() >= timedelta(hours=hours), hours

    @app.post("/api/client/appointments/<int:aid>/cancel")
    @web.login_required
    def c_cancel(aid):
        conn, u = web.get_db(), web.current_user()
        a = _own_appt(conn, u, aid)
        if a["status"] not in core.ACTIVE_FUTURE or a["status"] in ("arrive", "en_cours"):
            abort(409, "Ce rendez-vous ne peut plus être annulé.")
        ok, hours = _within_policy(conn, a)
        if not ok:
            abort(409, f"Les annulations en ligne sont possibles jusqu'à {hours} h avant le rendez-vous. Merci de contacter l'institut.")
        core.set_status(conn, aid, "annule")
        conn.commit()
        return jsonify(ok=True)

    @app.post("/api/client/appointments/<int:aid>/reschedule")
    @web.login_required
    def c_reschedule(aid):
        conn, u = web.get_db(), web.current_user()
        a = _own_appt(conn, u, aid)
        if a["status"] not in ("confirme", "en_attente", "demande"):
            abort(409, "Ce rendez-vous ne peut plus être déplacé.")
        ok, hours = _within_policy(conn, a)
        if not ok:
            abort(409, f"Le déplacement en ligne est possible jusqu'à {hours} h avant le rendez-vous.")
        d = web.body()
        try:
            new = datetime.fromisoformat(d.get("start", ""))
        except ValueError:
            abort(400, "Date invalide.")
        svc = row(conn, "SELECT * FROM services WHERE id=?", (a["service_id"],))
        if new.strftime("%H:%M") not in core.slots_for_day(conn, svc, new.date(), exclude_appt=aid):
            abort(409, "Ce créneau n'est pas disponible.")
        core.move_appointment(conn, aid, new, check=False)
        conn.commit()
        return jsonify(ok=True)

    @app.post("/api/client/bookings")
    @web.login_required
    def c_booking():
        """Parcours de réservation : diagnostic (si présent) -> devis -> rendez-vous -> acompte."""
        conn, u = web.get_db(), web.current_user()
        d = web.body()
        svc = row(conn, "SELECT * FROM services WHERE id=? AND active=1 AND online_bookable=1", (d.get("service_id"),))
        if not svc:
            abort(404, "Prestation introuvable.")
        try:
            start = datetime.fromisoformat(d.get("start", ""))
        except ValueError:
            abort(400, "Date invalide.")
        if start.strftime("%H:%M") not in core.slots_for_day(conn, svc, start.date()):
            abort(409, "Ce créneau n'est plus disponible.")

        quote_id = d.get("quote_id")
        sub_id, needs_validation = None, False
        diag = d.get("diagnostic")
        if quote_id:
            q = row(conn, "SELECT * FROM quotes WHERE id=? AND client_id=?", (quote_id, u["id"]))
            if not q or core.quote_out(q)["expired"] or q["status"] in ("refused", "converted"):
                abort(409, "Ce devis n'est plus disponible.")
            sub_id = q["submission_id"]
            if sub_id:
                needs_validation = bool(jload(row(conn, "SELECT result FROM submissions WHERE id=?", (sub_id,))["result"], {}).get("needs_validation"))
        elif diag:
            sub_id, result, quote_id = _save_diagnostic(conn, u, diag, svc)
            needs_validation = result["needs_validation"]
        elif svc["diagnostic_required"]:
            abort(400, "Un diagnostic est obligatoire pour cette prestation.")

        # statut initial : validation pro > acompte > confirmation automatique
        deposit = svc["deposit"] or 0
        pay = bool(d.get("pay_deposit")) and deposit > 0
        if needs_validation:
            status = "demande"
        elif deposit > 0 and not pay:
            status = "en_attente"
        else:
            status = None  # selon réglage de confirmation automatique
        aid = core.create_appointment(conn, u["id"], svc, start, status=status, notes=web.clean(d.get("notes"), 500),
                                      quote_id=quote_id, submission_id=sub_id, check=False)
        if pay:
            if PAYMENT_PROVIDER != "demo":
                abort(501, "Fournisseur de paiement non configuré.")
            core.record_payment(conn, u["id"], deposit, "carte (démo)", "deposit", appointment_id=aid, note="Acompte en ligne")
            notify.schedule_for_appointment(conn, aid)  # le message de confirmation mentionne l'acompte réglé
        if quote_id:
            conn.execute("UPDATE quotes SET status='converted', answered_at=? WHERE id=? AND status IN ('draft','sent','accepted')", (db.now_iso(), quote_id))
        conn.commit()
        return jsonify(appointment=appt_out(conn, row(conn, "SELECT * FROM appointments WHERE id=?", (aid,)))), 201

    # ---------------------------------------------------------------- avis
    @app.get("/api/client/reviews")
    @web.login_required
    def c_reviews():
        """Prestations terminées pouvant recevoir un avis + avis déjà donnés."""
        conn, u = web.get_db(), web.current_user()
        todo = rows(conn, "SELECT a.id, a.start, sv.name AS service_name FROM appointments a JOIN services sv ON sv.id=a.service_id "
                          "WHERE a.client_id=? AND a.status='termine' AND a.id NOT IN (SELECT appointment_id FROM reviews WHERE appointment_id IS NOT NULL) ORDER BY a.start DESC", (u["id"],))
        done = rows(conn, "SELECT r.id, r.rating, r.text, r.status, r.created_at, sv.name AS service FROM reviews r LEFT JOIN services sv ON sv.id=r.service_id WHERE r.client_id=? ORDER BY r.id DESC", (u["id"],))
        return jsonify(eligible=todo, reviews=done)

    @app.post("/api/client/reviews")
    @web.login_required
    def c_review_create():
        conn, u = web.get_db(), web.current_user()
        d = web.body()
        a = row(conn, "SELECT * FROM appointments WHERE id=? AND client_id=? AND status='termine'", (d.get("appointment_id"), u["id"]))
        if not a:
            abort(409, "Vous pouvez donner votre avis après une prestation réalisée.")
        if row(conn, "SELECT 1 AS x FROM reviews WHERE appointment_id=?", (a["id"],)):
            abort(409, "Vous avez déjà donné votre avis sur cette prestation.")
        try:
            rating = int(d.get("rating"))
        except (TypeError, ValueError):
            abort(400, "Note invalide.")
        if not 1 <= rating <= 5:
            abort(400, "La note doit être comprise entre 1 et 5.")
        name = f"{u['first_name']} {u['last_name'][:1]}." if u["last_name"] else u["first_name"]
        conn.execute("INSERT INTO reviews(client_id,appointment_id,service_id,rating,text,display_name,status,created_at) VALUES (?,?,?,?,?,?,'pending',?)",
                     (u["id"], a["id"], a["service_id"], rating, web.clean(d.get("text"), 800), name, db.now_iso()))
        conn.commit()
        return jsonify(ok=True), 201

    # --------------------------------------------------------------- devis
    @app.get("/api/client/quotes")
    @web.login_required
    def c_quotes():
        conn, u = web.get_db(), web.current_user()
        return jsonify(quotes=[core.quote_out(q) for q in rows(conn, "SELECT * FROM quotes WHERE client_id=? ORDER BY id DESC", (u["id"],))])

    def _own_quote(conn, u, qid):
        q = row(conn, "SELECT * FROM quotes WHERE id=? AND client_id=?", (qid, u["id"]))
        if not q:
            abort(404, "Devis introuvable.")
        return q

    @app.get("/api/client/quotes/<int:qid>")
    @web.login_required
    def c_quote(qid):
        conn, u = web.get_db(), web.current_user()
        q = core.quote_out(_own_quote(conn, u, qid))
        if q["submission_id"]:
            s = row(conn, "SELECT result, service_id FROM submissions WHERE id=?", (q["submission_id"],))
            q["result"] = jload(s["result"], {})
            q["requested_service_id"] = s["service_id"]
        return jsonify(quote=q)

    @app.post("/api/client/quotes/<int:qid>/<action>")
    @web.login_required
    def c_quote_action(qid, action):
        conn, u = web.get_db(), web.current_user()
        if action not in ("accept", "refuse"):
            abort(404)
        q = _own_quote(conn, u, qid)
        return jsonify(quote=app.answer_quote(conn, q, action))

    @app.get("/api/client/quotes/<int:qid>.pdf")
    @web.login_required
    def c_quote_pdf(qid):
        conn, u = web.get_db(), web.current_user()
        return app.quote_pdf(conn, _own_quote(conn, u, qid))


    @app.post("/api/client/diagnostics")
    @web.login_required
    def c_save_diagnostic():
        """Enregistre le diagnostic et son devis sans réserver (consultation ultérieure)."""
        conn, u = web.get_db(), web.current_user()
        d = web.body()
        sub_id, result, quote_id = _save_diagnostic(conn, u, d)
        conn.commit()
        return jsonify(submission_id=sub_id, quote_id=quote_id, result=result), 201

    @app.post("/api/client/quotes/<int:qid>/email")
    @web.login_required
    def c_quote_email(qid):
        conn, u = web.get_db(), web.current_user()
        q = _own_quote(conn, u, qid)
        inst = core.setting(conn, "institute", {})
        link = request.host_url.rstrip("/") + f"/devis/{q['token']}"
        notify.queue(conn, u["id"], "quote", f"Votre devis {q['number']} — {inst.get('name', '')}",
                     f"Bonjour {u['first_name']},\n\nVoici votre devis {q['number']} (total {q['total']:.2f} €, valable jusqu'au {q['valid_until']}) :\n{link}\n\n{inst.get('name', '')}")
        notify.process_outbox(conn)
        conn.commit()
        return jsonify(ok=True)

    # ------------------------------------------------- diagnostics, factures, fidélité
    @app.get("/api/client/history")
    @web.login_required
    def c_history():
        conn, u = web.get_db(), web.current_user()
        subs = rows(conn, "SELECT s.id,s.created_at,s.result,s.photos,s.validation,d.name AS diagnostic,sv.name AS service FROM submissions s "
                          "JOIN diagnostics d ON d.id=s.diagnostic_id LEFT JOIN services sv ON sv.id=s.service_id WHERE s.client_id=? ORDER BY s.id DESC", (u["id"],))
        for s in subs:
            s["result"] = jload(s["result"], {})
            s["photos"] = jload(s["photos"], [])
        done = [appt_out(conn, a) for a in rows(conn, "SELECT * FROM appointments WHERE client_id=? AND status='termine' ORDER BY start DESC", (u["id"],))]
        return jsonify(diagnostics=subs, appointments=done)

    @app.get("/api/client/invoices")
    @web.login_required
    def c_invoices():
        conn, u = web.get_db(), web.current_user()
        invs = rows(conn, "SELECT * FROM invoices WHERE client_id=? ORDER BY id DESC", (u["id"],))
        for i in invs:
            i["items"] = jload(i["items"], [])
            i["paid"] = core.invoice_paid(conn, i["id"])
        return jsonify(invoices=invs)

    @app.get("/api/client/invoices/<int:iid>.pdf")
    @web.login_required
    def c_invoice_pdf(iid):
        conn, u = web.get_db(), web.current_user()
        inv = row(conn, "SELECT * FROM invoices WHERE id=? AND client_id=?", (iid, u["id"]))
        if not inv:
            abort(404)
        return invoice_pdf(conn, inv)

    @app.get("/api/client/loyalty")
    @web.login_required
    def c_loyalty():
        conn, u = web.get_db(), web.current_user()
        return jsonify(points=u["loyalty_points"], config=core.setting(conn, "loyalty", {}),
                       ledger=rows(conn, "SELECT points,reason,created_at FROM loyalty_ledger WHERE client_id=? ORDER BY id DESC LIMIT 50", (u["id"],)))

    @app.get("/api/client/notifications")
    @web.login_required
    def c_notifications():
        conn, u = web.get_db(), web.current_user()
        return jsonify(notifications=rows(conn, "SELECT id,kind,subject,body,send_at,status FROM outbox WHERE client_id=? AND status IN ('sent','simulated','pending') ORDER BY send_at DESC LIMIT 40", (u["id"],)))

    # --------------------------------------------------------------- profil
    @app.put("/api/client/profile")
    @web.login_required
    def c_profile():
        conn, u = web.get_db(), web.current_user()
        d = web.body()
        email = web.clean(d.get("email", u["email"]), 200).lower()
        if not web.valid_email(email):
            abort(400, "Adresse email invalide.")
        if row(conn, "SELECT 1 AS x FROM users WHERE email=? AND id<>?", (email, u["id"])):
            abort(409, "Cet email est déjà utilisé.")
        conn.execute(
            "UPDATE users SET email=?, first_name=?, last_name=?, phone=?, birth_date=?, address=?, preferences=?, consent_marketing=?, consent_photos=? WHERE id=?",
            (email, web.clean(d.get("first_name", u["first_name"]), 80), web.clean(d.get("last_name", u["last_name"]), 80),
             web.clean(d.get("phone"), 30), web.clean(d.get("birth_date"), 10), web.clean(d.get("address"), 300),
             web.clean(d.get("preferences"), 500), int(bool(d.get("consent_marketing"))), int(bool(d.get("consent_photos"))), u["id"]))
        conn.commit()
        return jsonify(user=web.public_user(row(conn, "SELECT * FROM users WHERE id=?", (u["id"],))))

    @app.post("/api/client/password")
    @web.login_required
    def c_password():
        conn, u = web.get_db(), web.current_user()
        d = web.body()
        if not check_password_hash(u["pw_hash"], d.get("current") or ""):
            abort(400, "Mot de passe actuel incorrect.")
        if len(d.get("new") or "") < 8:
            abort(400, "Le nouveau mot de passe doit contenir au moins 8 caractères.")
        conn.execute("UPDATE users SET pw_hash=? WHERE id=?", (generate_password_hash(d["new"]), u["id"]))
        conn.commit()
        return jsonify(ok=True)

    @app.get("/api/client/export")
    @web.login_required
    def c_export():
        """Export RGPD des données de la cliente."""
        conn, u = web.get_db(), web.current_user()
        data = {
            "profil": web.public_user(u),
            "rendez_vous": rows(conn, "SELECT * FROM appointments WHERE client_id=?", (u["id"],)),
            "devis": [core.quote_out(q) for q in rows(conn, "SELECT * FROM quotes WHERE client_id=?", (u["id"],))],
            "factures": rows(conn, "SELECT * FROM invoices WHERE client_id=?", (u["id"],)),
            "diagnostics": rows(conn, "SELECT id,diagnostic_id,answers,result,created_at FROM submissions WHERE client_id=?", (u["id"],)),
            "points_fidelite": rows(conn, "SELECT * FROM loyalty_ledger WHERE client_id=?", (u["id"],)),
        }
        return Response(jdump(data), mimetype="application/json",
                        headers={"Content-Disposition": 'attachment; filename="mes-donnees.json"'})

    @app.delete("/api/client/account")
    @web.login_required
    def c_delete():
        """Suppression : données personnelles effacées, pièces comptables conservées (obligation légale)."""
        conn, u = web.get_db(), web.current_user()
        if not check_password_hash(u["pw_hash"], (web.body().get("password") or "")):
            abort(400, "Mot de passe incorrect.")
        conn.execute("UPDATE appointments SET status='annule' WHERE client_id=? AND start>=? AND status IN ('demande','confirme','en_attente')", (u["id"], db.now_iso()))
        conn.execute("UPDATE outbox SET status='cancelled' WHERE client_id=? AND status='pending'", (u["id"],))
        conn.execute("DELETE FROM client_notes WHERE client_id=?", (u["id"],))
        for s in rows(conn, "SELECT photos FROM submissions WHERE client_id=?", (u["id"],)):
            for p in jload(s["photos"], []):
                _remove_private(p["file"])
        for p in rows(conn, "SELECT file FROM ba_photos WHERE client_id=?", (u["id"],)):
            _remove_private(p["file"])
        conn.execute("DELETE FROM ba_photos WHERE client_id=?", (u["id"],))
        conn.execute("UPDATE submissions SET photos='[]', answers='{}' WHERE client_id=?", (u["id"],))
        conn.execute("UPDATE users SET deleted=1, email=NULL, pw_hash=NULL, first_name='Compte', last_name='supprimé', phone='', birth_date='', address='', "
                     "notes='', preferences='', consent_marketing=0, consent_photos=0 WHERE id=?", (u["id"],))
        conn.commit()
        from flask import session
        session.clear()
        return jsonify(ok=True)


def _save_diagnostic(conn, u, diag, fallback_svc=None):
    """Enregistre un diagnostic (réponses, photos) et le devis qui en découle. Le résultat est toujours recalculé côté serveur."""
    dg = core.load_diagnostic(conn, slug=diag.get("slug"))
    if not dg:
        abort(404, "Diagnostic introuvable.")
    requested = row(conn, "SELECT * FROM services WHERE id=?", (diag.get("service_id"),)) or fallback_svc
    answers = core.sanitize_answers(dg, diag.get("answers") or {})
    if engine.missing_required(dg, answers):
        abort(400, "Diagnostic incomplet.")
    result = core.run_diagnostic(conn, dg, answers, requested)
    photos = []
    for slot in dg["photo_slots"]:
        img = (diag.get("photos") or {}).get(slot["id"])
        if img:
            photos.append({"slot": slot["id"], "label": slot["label"], "file": web.save_image(img)})
    sub_id = conn.execute(
        "INSERT INTO submissions(client_id,diagnostic_id,service_id,answers,photos,result,validation,created_at) VALUES (?,?,?,?,?,?,?,?)",
        (u["id"], dg["id"], requested["id"] if requested else None, jdump(answers), jdump(photos), jdump(result),
         "pending" if result["needs_validation"] else "none", db.now_iso())).lastrowid
    quote_id = None
    items = [{"label": r["name"], "price": r["price"], "qty": 1, "service_id": r["id"]} for r in result["recommended"]]
    if items:
        quote_id = core.create_quote(conn, u["id"], items, result["steps"], sub_id, status="sent")
    return sub_id, result, quote_id


def _remove_private(name):
    try:
        os.remove(os.path.join(db.UPLOAD_DIR, "private", name))
    except OSError:
        pass


def invoice_pdf(conn, inv):
    doc = dict(inv)
    doc["items"] = jload(inv["items"], [])
    client = row(conn, "SELECT * FROM users WHERE id=?", (inv["client_id"],))
    data = pdfdoc.build("invoice", doc, client, core.setting(conn, "institute", {}), {"paid": core.invoice_paid(conn, inv["id"])})
    return Response(data, mimetype="application/pdf", headers={"Content-Disposition": f'inline; filename="{inv["number"]}.pdf"'})
