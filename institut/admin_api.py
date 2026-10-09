"""API de l'espace professionnel (toutes les routes exigent le rôle « pro »)."""

import re
import secrets
from datetime import date, datetime, timedelta

from flask import abort, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

import core
import db
import engine
import notify
import web
from client_api import appt_out, invoice_pdf
from db import jdump, jload, now_iso, row, rows

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,40}$")
QTYPES = ("single", "multi", "yesno", "scale", "text")


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower().translate(str.maketrans("àâäéèêëîïôöùûüç", "aaaeeeeiioouuuc"))).strip("-")
    return s[:40] or secrets.token_hex(3)


def num(v, default=0.0, lo=0.0):
    try:
        return max(lo, float(v))
    except (TypeError, ValueError):
        return default


def client_card(c):
    return {k: c[k] for k in ("id", "first_name", "last_name", "email", "phone", "loyalty_points", "created_at")}


def validate_questions(qs):
    if not isinstance(qs, list) or not qs:
        abort(400, "Le diagnostic doit contenir au moins une question.")
    seen = set()
    for q in qs:
        if not SLUG_RE.match(str(q.get("id", ""))) or q["id"] in seen:
            abort(400, f"Identifiant de question invalide ou en double : {q.get('id')}")
        seen.add(q["id"])
        if q.get("type") not in QTYPES or not str(q.get("label", "")).strip():
            abort(400, f"Question « {q.get('id')} » : type ou intitulé invalide.")
        if q["type"] in ("single", "multi", "yesno", "scale"):
            if not q.get("options"):
                abort(400, f"Question « {q['label']} » : ajoutez au moins une réponse possible.")
            vals = [str(o.get("value", "")) for o in q["options"]]
            if "" in vals or len(set(vals)) != len(vals):
                abort(400, f"Question « {q['label']} » : valeurs de réponse vides ou en double.")
    return qs


def validate_condition(cond, qids, depth=0):
    if not cond:
        return
    if depth > 6:
        abort(400, "Condition trop imbriquée.")
    if "all" in cond or "any" in cond:
        for c in cond.get("all", cond.get("any", [])):
            validate_condition(c, qids, depth + 1)
        return
    if cond.get("q") not in qids:
        abort(400, f"Condition : question inconnue « {cond.get('q')} ».")
    if cond.get("op") not in engine.OPERATORS:
        abort(400, "Condition : opérateur inconnu.")


def validate_action(act, slugs):
    if not isinstance(act, dict):
        abort(400, "Action invalide.")
    if act.get("verdict") and act["verdict"] not in engine.VERDICT_ORDER:
        abort(400, "Verdict inconnu.")
    for s in act.get("recommend", []) or []:
        if s not in slugs:
            abort(400, f"Prestation recommandée inconnue : {s}")
    return {k: act[k] for k in ("verdict", "validation", "alert", "message", "recommend", "note") if act.get(k) not in (None, "", [], False)}


def register(app):
    def conn_():
        return web.get_db()

    P = "/api/admin"

    # =============================================================== tableau de bord
    @app.get(P + "/dashboard")
    @web.pro_required
    def a_dashboard():
        conn = conn_()
        today = date.today()
        d0, d1 = today.isoformat(), (today + timedelta(days=1)).isoformat()
        todays = rows(conn, "SELECT * FROM appointments WHERE start>=? AND start<? AND status NOT IN ('annule') ORDER BY start", (d0, d1))
        month0 = today.replace(day=1).isoformat()
        revenue = conn.execute("SELECT COALESCE(SUM(CASE WHEN kind='refund' THEN -amount ELSE amount END),0) FROM payments WHERE created_at>=?", (month0,)).fetchone()[0]
        low = rows(conn, "SELECT id,name,stock,min_stock,unit FROM products WHERE active=1 AND stock<=min_stock ORDER BY stock-min_stock")
        soon = (today + timedelta(days=45)).isoformat()
        expiring = rows(conn, "SELECT id,name,expiry_date FROM products WHERE active=1 AND expiry_date<>'' AND expiry_date<=? ORDER BY expiry_date", (soon,))
        pending_q = [core.quote_out(q) for q in rows(conn, "SELECT * FROM quotes WHERE status IN ('draft','sent') ORDER BY id DESC")]
        pending_q = [q for q in pending_q if not q["expired"]]
        diag = rows(conn, "SELECT s.id, s.created_at, s.result, u.first_name, u.last_name, sv.name AS service FROM submissions s "
                          "JOIN users u ON u.id=s.client_id LEFT JOIN services sv ON sv.id=s.service_id WHERE s.validation='pending' ORDER BY s.id DESC")
        for s in diag:
            s["result"] = jload(s["result"], {})
        requests_ = rows(conn, "SELECT * FROM appointments WHERE status='demande' ORDER BY start")
        due = conn.execute("SELECT COUNT(*), COALESCE(SUM(total),0) FROM invoices WHERE status IN ('due','partial')").fetchone()
        return jsonify(
            kpis={"appointments_today": len(todays), "diagnostics_to_review": len(diag), "quotes_pending": len(pending_q),
                  "low_stock": len(low), "requests": len(requests_), "revenue_month": revenue, "invoices_due": due[0], "invoices_due_total": due[1]},
            today=[_cal_appt(conn, a) for a in todays],
            requests=[_cal_appt(conn, a) for a in requests_], diagnostics=diag, quotes=pending_q[:8],
            low_stock=low[:8], expiring=expiring[:8])

    def _cal_appt(conn, a):
        cl = row(conn, "SELECT first_name,last_name,phone FROM users WHERE id=?", (a["client_id"],))
        out = appt_out(conn, a)
        out["client_name"] = f"{cl['first_name']} {cl['last_name']}".strip()
        out["client_phone"] = cl["phone"]
        return out

    # ================================================================== clientes
    @app.get(P + "/clients")
    @web.pro_required
    def a_clients():
        conn = conn_()
        q = f"%{web.clean(request.args.get('q'), 60)}%"
        cs = rows(conn, "SELECT * FROM users WHERE role='client' AND deleted=0 AND (first_name||' '||last_name LIKE ? OR email LIKE ? OR phone LIKE ?) ORDER BY last_name, first_name LIMIT 300", (q, q, q))
        out = []
        for c in cs:
            card = client_card(c)
            st = conn.execute("SELECT COUNT(*), COALESCE(SUM(price),0), MAX(start) FROM appointments WHERE client_id=? AND status='termine'", (c["id"],)).fetchone()
            nxt = conn.execute("SELECT MIN(start) FROM appointments WHERE client_id=? AND start>=? AND status IN ('demande','confirme','en_attente')", (c["id"], now_iso())).fetchone()[0]
            card.update(visits=st[0], spent=st[1], last_visit=st[2], next_visit=nxt)
            out.append(card)
        return jsonify(clients=out)

    @app.post(P + "/clients")
    @web.pro_required
    def a_client_create():
        conn, d = conn_(), web.body()
        web.need(d, "first_name", "last_name")
        email = web.clean(d.get("email"), 200).lower() or None
        if email and (not web.valid_email(email) or row(conn, "SELECT 1 AS x FROM users WHERE email=?", (email,))):
            abort(409, "Email invalide ou déjà utilisé.")
        cur = conn.execute(
            "INSERT INTO users(role,email,first_name,last_name,phone,birth_date,address,notes,preferences,consent_data,consent_marketing,consent_photos,created_at) VALUES ('client',?,?,?,?,?,?,?,?,?,?,?,?)",
            (email, web.clean(d["first_name"], 80), web.clean(d["last_name"], 80), web.clean(d.get("phone"), 30), web.clean(d.get("birth_date"), 10),
             web.clean(d.get("address"), 300), web.clean(d.get("notes"), 3000), web.clean(d.get("preferences"), 500),
             int(bool(d.get("consent_data"))), int(bool(d.get("consent_marketing"))), int(bool(d.get("consent_photos"))), now_iso()))
        conn.commit()
        return jsonify(id=cur.lastrowid), 201

    @app.get(P + "/clients/<int:cid>")
    @web.pro_required
    def a_client(cid):
        conn = conn_()
        c = row(conn, "SELECT * FROM users WHERE id=? AND role='client' AND deleted=0", (cid,))
        if not c:
            abort(404, "Cliente introuvable.")
        c.pop("pw_hash", None)
        appts = [appt_out(conn, a) for a in rows(conn, "SELECT * FROM appointments WHERE client_id=? ORDER BY start DESC", (cid,))]
        quotes = [core.quote_out(q) for q in rows(conn, "SELECT * FROM quotes WHERE client_id=? ORDER BY id DESC", (cid,))]
        invoices = rows(conn, "SELECT * FROM invoices WHERE client_id=? ORDER BY id DESC", (cid,))
        for i in invoices:
            i["items"] = jload(i["items"], [])
            i["paid"] = core.invoice_paid(conn, i["id"])
        payments = rows(conn, "SELECT * FROM payments WHERE client_id=? ORDER BY id DESC", (cid,))
        subs = rows(conn, "SELECT s.*, d.name AS diagnostic, sv.name AS service FROM submissions s JOIN diagnostics d ON d.id=s.diagnostic_id LEFT JOIN services sv ON sv.id=s.service_id WHERE s.client_id=? ORDER BY s.id DESC", (cid,))
        for s in subs:
            s["answers"], s["photos"], s["result"] = jload(s["answers"], {}), jload(s["photos"], []), jload(s["result"], {})
        photos = rows(conn, "SELECT b.*, sv.name AS service FROM ba_photos b LEFT JOIN services sv ON sv.id=b.service_id WHERE b.client_id=? ORDER BY b.taken_on DESC, b.id DESC", (cid,))
        used = rows(conn, "SELECT cp.*, p.name FROM client_products cp JOIN products p ON p.id=cp.product_id WHERE cp.client_id=? ORDER BY cp.id DESC", (cid,))
        notes = rows(conn, "SELECT * FROM client_notes WHERE client_id=? ORDER BY id DESC", (cid,))
        ledger = rows(conn, "SELECT * FROM loyalty_ledger WHERE client_id=? ORDER BY id DESC LIMIT 30", (cid,))

        tl = []
        for a in appts:
            tl.append({"at": a["start"], "type": "appointment", "title": f"{a['service_name']} — {a['status_label']}", "detail": f"{a['price']:.0f} €", "ref": a["id"]})
        for q in quotes:
            tl.append({"at": q["created_at"], "type": "quote", "title": f"Devis {q['number']} ({q['effective_status']})", "detail": f"{q['total']:.0f} €", "ref": q["id"]})
        for i in invoices:
            tl.append({"at": i["created_at"], "type": "invoice", "title": f"Facture {i['number']}", "detail": f"{i['total']:.0f} € — {i['status']}", "ref": i["id"]})
        for p in payments:
            tl.append({"at": p["created_at"], "type": "payment", "title": f"Paiement {p['kind']}", "detail": f"{p['amount']:.0f} € ({p['method']})", "ref": p["id"]})
        for s in subs:
            tl.append({"at": s["created_at"], "type": "diagnostic", "title": f"{s['diagnostic']} — {s['result'].get('title', '')}", "detail": s["service"] or "", "ref": s["id"]})
        for p in photos:
            tl.append({"at": p["taken_on"] + "T00:00", "type": "photo", "title": f"Photo {'avant' if p['kind'] == 'before' else 'après'}", "detail": p["service"] or "", "ref": p["id"]})
        for n in notes:
            tl.append({"at": n["created_at"], "type": "note", "title": "Note", "detail": n["text"], "ref": n["id"]})
        tl.sort(key=lambda e: e["at"], reverse=True)

        spent = conn.execute("SELECT COALESCE(SUM(CASE WHEN kind='refund' THEN -amount ELSE amount END),0) FROM payments WHERE client_id=?", (cid,)).fetchone()[0]
        return jsonify(client=c, appointments=appts, quotes=quotes, invoices=invoices, payments=payments, diagnostics=subs,
                       photos=photos, products=used, notes=notes, loyalty_ledger=ledger, timeline=tl, spent=spent)

    @app.put(P + "/clients/<int:cid>")
    @web.pro_required
    def a_client_update(cid):
        conn, d = conn_(), web.body()
        c = row(conn, "SELECT * FROM users WHERE id=? AND role='client' AND deleted=0", (cid,))
        if not c:
            abort(404)
        email = web.clean(d.get("email", c["email"]), 200).lower() or None
        if email and (not web.valid_email(email) or row(conn, "SELECT 1 AS x FROM users WHERE email=? AND id<>?", (email, cid))):
            abort(409, "Email invalide ou déjà utilisé.")
        conn.execute(
            "UPDATE users SET email=?, first_name=?, last_name=?, phone=?, birth_date=?, address=?, notes=?, preferences=?, consent_marketing=?, consent_photos=?, consent_data=? WHERE id=?",
            (email, web.clean(d.get("first_name", c["first_name"]), 80), web.clean(d.get("last_name", c["last_name"]), 80), web.clean(d.get("phone", c["phone"]), 30),
             web.clean(d.get("birth_date", c["birth_date"]), 10), web.clean(d.get("address", c["address"]), 300), web.clean(d.get("notes", c["notes"]), 3000),
             web.clean(d.get("preferences", c["preferences"]), 500), int(bool(d.get("consent_marketing", c["consent_marketing"]))),
             int(bool(d.get("consent_photos", c["consent_photos"]))), int(bool(d.get("consent_data", c["consent_data"]))), cid))
        if not d.get("consent_photos", c["consent_photos"]):
            conn.execute("UPDATE ba_photos SET marketing_ok=0 WHERE client_id=?", (cid,))  # retrait du consentement
        conn.commit()
        return jsonify(ok=True)

    @app.post(P + "/clients/<int:cid>/notes")
    @web.pro_required
    def a_client_note(cid):
        conn, d = conn_(), web.body()
        web.need(d, "text")
        conn.execute("INSERT INTO client_notes(client_id,text,created_at) VALUES (?,?,?)", (cid, web.clean(d["text"], 3000), now_iso()))
        conn.commit()
        return jsonify(ok=True), 201

    @app.delete(P + "/client-notes/<int:nid>")
    @web.pro_required
    def a_client_note_del(nid):
        conn_().execute("DELETE FROM client_notes WHERE id=?", (nid,))
        conn_().commit()
        return jsonify(ok=True)

    @app.post(P + "/clients/<int:cid>/loyalty")
    @web.pro_required
    def a_client_loyalty(cid):
        conn, d = conn_(), web.body()
        pts = int(num(d.get("points"), 0, -100000))
        if not pts:
            abort(400, "Nombre de points invalide.")
        core.loyalty_adjust(conn, cid, pts, web.clean(d.get("reason"), 120) or "Ajustement manuel")
        conn.commit()
        return jsonify(ok=True)

    @app.post(P + "/clients/<int:cid>/reset-password")
    @web.pro_required
    def a_client_reset(cid):
        conn = conn_()
        if not row(conn, "SELECT 1 AS x FROM users WHERE id=? AND role='client' AND deleted=0", (cid,)):
            abort(404)
        tmp = secrets.token_urlsafe(8)
        conn.execute("UPDATE users SET pw_hash=? WHERE id=?", (generate_password_hash(tmp), cid))
        conn.commit()
        return jsonify(temporary_password=tmp)

    # ============================================================ planning
    @app.get(P + "/calendar")
    @web.pro_required
    def a_calendar():
        conn = conn_()
        f, t = request.args.get("from"), request.args.get("to")
        try:
            datetime.fromisoformat(f), datetime.fromisoformat(t)
        except (TypeError, ValueError):
            abort(400, "Période invalide.")
        appts = rows(conn, "SELECT * FROM appointments WHERE start<? AND end>=? ORDER BY start", (t, f))
        blocks = rows(conn, "SELECT * FROM blocks WHERE start<? AND end>=? ORDER BY start", (t, f))
        return jsonify(appointments=[_cal_appt(conn, a) for a in appts], blocks=blocks,
                       hours=core.setting(conn, "opening_hours", {}))

    @app.get(P + "/appointments/<int:aid>")
    @web.pro_required
    def a_appt_get(aid):
        conn = conn_()
        a = row(conn, "SELECT * FROM appointments WHERE id=?", (aid,))
        if not a:
            abort(404, "Rendez-vous introuvable.")
        out = _cal_appt(conn, a)
        if a["submission_id"]:
            s = row(conn, "SELECT result, validation FROM submissions WHERE id=?", (a["submission_id"],))
            out["diagnostic"] = {"result": jload(s["result"], {}), "validation": s["validation"]}
        return jsonify(appointment=out)

    @app.post(P + "/appointments")
    @web.pro_required
    def a_appt_create():
        conn, d = conn_(), web.body()
        svc = row(conn, "SELECT * FROM services WHERE id=?", (d.get("service_id"),))
        cl = row(conn, "SELECT id FROM users WHERE id=? AND role='client' AND deleted=0", (d.get("client_id"),))
        if not svc or not cl:
            abort(400, "Cliente ou prestation invalide.")
        try:
            start = datetime.fromisoformat(d.get("start", ""))
        except ValueError:
            abort(400, "Date invalide.")
        status = d.get("status") or "confirme"
        if status not in core.STATUSES:
            abort(400, "Statut invalide.")
        aid = core.create_appointment(conn, cl["id"], svc, start, status=status, source="manual", notes=web.clean(d.get("notes"), 500),
                                      price=num(d["price"], svc["price"]) if d.get("price") not in (None, "") else None,
                                      check=not d.get("force"))
        conn.commit()
        return jsonify(id=aid), 201

    @app.put(P + "/appointments/<int:aid>")
    @web.pro_required
    def a_appt_update(aid):
        conn, d = conn_(), web.body()
        a = row(conn, "SELECT * FROM appointments WHERE id=?", (aid,))
        if not a:
            abort(404)
        if d.get("start") and d["start"] != a["start"]:
            core.move_appointment(conn, aid, datetime.fromisoformat(d["start"]), check=not d.get("force"))
        conn.execute("UPDATE appointments SET notes=?, price=? WHERE id=?",
                     (web.clean(d.get("notes", a["notes"]), 500), num(d.get("price", a["price"]), a["price"]), aid))
        if d.get("status") and d["status"] != a["status"]:
            core.set_status(conn, aid, d["status"])
        conn.commit()
        return jsonify(ok=True)

    @app.post(P + "/appointments/<int:aid>/status")
    @web.pro_required
    def a_appt_status(aid):
        conn, d = conn_(), web.body()
        if not row(conn, "SELECT 1 AS x FROM appointments WHERE id=?", (aid,)):
            abort(404)
        core.set_status(conn, aid, d.get("status"))
        conn.commit()
        return jsonify(ok=True)

    @app.post(P + "/appointments/<int:aid>/invoice")
    @web.pro_required
    def a_appt_invoice(aid):
        conn = conn_()
        iid = core.ensure_invoice(conn, aid)
        conn.commit()
        return jsonify(id=iid)

    @app.post(P + "/blocks")
    @web.pro_required
    def a_block_create():
        conn, d = conn_(), web.body()
        if d.get("kind") not in ("block", "leave", "open"):
            abort(400, "Type invalide.")
        try:
            s, e = datetime.fromisoformat(d["start"]), datetime.fromisoformat(d["end"])
        except (KeyError, ValueError):
            abort(400, "Dates invalides.")
        if e <= s:
            abort(400, "La fin doit être après le début.")
        cur = conn.execute("INSERT INTO blocks(kind,start,end,label) VALUES (?,?,?,?)", (d["kind"], core.iso(s), core.iso(e), web.clean(d.get("label"), 120)))
        conn.commit()
        return jsonify(id=cur.lastrowid), 201

    @app.delete(P + "/blocks/<int:bid>")
    @web.pro_required
    def a_block_del(bid):
        conn_().execute("DELETE FROM blocks WHERE id=?", (bid,))
        conn_().commit()
        return jsonify(ok=True)

    @app.get(P + "/availability")
    @web.pro_required
    def a_availability():
        conn = conn_()
        svc = row(conn, "SELECT * FROM services WHERE id=?", (request.args.get("service_id"),))
        if not svc:
            abort(404)
        try:
            day = date.fromisoformat(request.args.get("date", ""))
        except ValueError:
            abort(400, "Date invalide.")
        return jsonify(slots=core.slots_for_day(conn, svc, day))

    # ============================================================== prestations
    def _svc_out(conn, s):
        s["products"] = rows(conn, "SELECT sp.product_id, sp.qty, p.name, p.unit FROM service_products sp JOIN products p ON p.id=sp.product_id WHERE sp.service_id=?", (s["id"],))
        return s

    @app.get(P + "/services")
    @web.pro_required
    def a_services():
        conn = conn_()
        return jsonify(services=[_svc_out(conn, s) for s in rows(conn, "SELECT * FROM services ORDER BY category, position, id")])

    def _save_service(conn, sid, d):
        web.need(d, "name", "category")
        fields = (web.clean(d["name"], 120), web.clean(d["category"], 60), web.clean(d.get("description"), 1000),
                  num(d.get("price")), int(num(d.get("duration"), 60, 5)), int(num(d.get("prep_time"))), int(num(d.get("cleanup_time"))),
                  num(d.get("deposit")), web.clean(d.get("conditions"), 1000), web.clean(d.get("photo"), 300),
                  d.get("diagnostic_id") or None, int(bool(d.get("diagnostic_required")) and bool(d.get("diagnostic_id"))),
                  int(bool(d.get("active", True))), int(bool(d.get("online_bookable", True))))
        if sid is None:
            slug = slugify(d["name"])
            while row(conn, "SELECT 1 AS x FROM services WHERE slug=?", (slug,)):
                slug += "-" + secrets.token_hex(2)
            sid = conn.execute(
                "INSERT INTO services(name,category,description,price,duration,prep_time,cleanup_time,deposit,conditions,photo,diagnostic_id,diagnostic_required,active,online_bookable,slug,position) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,(SELECT COALESCE(MAX(position),0)+1 FROM services))", (*fields, slug)).lastrowid
        else:
            conn.execute("UPDATE services SET name=?,category=?,description=?,price=?,duration=?,prep_time=?,cleanup_time=?,deposit=?,conditions=?,photo=?,diagnostic_id=?,diagnostic_required=?,active=?,online_bookable=? WHERE id=?", (*fields, sid))
        if "products" in d:
            conn.execute("DELETE FROM service_products WHERE service_id=?", (sid,))
            for p in d["products"] or []:
                if row(conn, "SELECT 1 AS x FROM products WHERE id=?", (p.get("product_id"),)):
                    conn.execute("INSERT OR REPLACE INTO service_products(service_id,product_id,qty) VALUES (?,?,?)", (sid, p["product_id"], num(p.get("qty"), 1, 0.001)))
        conn.commit()
        return sid

    @app.post(P + "/services")
    @web.pro_required
    def a_service_create():
        return jsonify(id=_save_service(conn_(), None, web.body())), 201

    @app.put(P + "/services/<int:sid>")
    @web.pro_required
    def a_service_update(sid):
        if not row(conn_(), "SELECT 1 AS x FROM services WHERE id=?", (sid,)):
            abort(404)
        _save_service(conn_(), sid, web.body())
        return jsonify(ok=True)

    @app.delete(P + "/services/<int:sid>")
    @web.pro_required
    def a_service_delete(sid):
        conn = conn_()
        if row(conn, "SELECT 1 AS x FROM appointments WHERE service_id=?", (sid,)):
            conn.execute("UPDATE services SET active=0 WHERE id=?", (sid,))  # historique conservé
            conn.commit()
            return jsonify(archived=True)
        conn.execute("DELETE FROM services WHERE id=?", (sid,))
        conn.commit()
        return jsonify(deleted=True)

    # ================================================================== produits & stocks
    def _prod_out(p):
        p["low"] = p["stock"] <= p["min_stock"]
        p["expiring"] = bool(p["expiry_date"]) and p["expiry_date"] <= (date.today() + timedelta(days=45)).isoformat()
        p["expired"] = bool(p["expiry_date"]) and p["expiry_date"] < date.today().isoformat()
        p["value"] = round(p["stock"] * p["cost_price"], 2)
        return p

    @app.get(P + "/products")
    @web.pro_required
    def a_products():
        conn = conn_()
        ps = [_prod_out(p) for p in rows(conn, "SELECT * FROM products ORDER BY category, name")]
        since = (datetime.now() - timedelta(days=60)).isoformat()
        for p in ps:
            used = conn.execute("SELECT COALESCE(-SUM(delta),0) FROM stock_movements WHERE product_id=? AND delta<0 AND reason IN ('usage','sale') AND created_at>=?", (p["id"], since)).fetchone()[0]
            per_day = used / 60
            p["days_left"] = round(p["stock"] / per_day) if per_day > 0 else None
            p["services"] = [r["name"] for r in rows(conn, "SELECT s.name FROM service_products sp JOIN services s ON s.id=sp.service_id WHERE sp.product_id=?", (p["id"],))]
        total = sum(p["value"] for p in ps if p["active"])
        return jsonify(products=ps, summary={"value": round(total, 2), "low": sum(1 for p in ps if p["active"] and p["low"]),
                                             "expiring": sum(1 for p in ps if p["active"] and p["expiring"])})

    def _save_product(conn, pid, d):
        web.need(d, "name")
        vals = (web.clean(d["name"], 120), web.clean(d.get("brand"), 80), web.clean(d.get("category"), 60), web.clean(d.get("sku"), 60),
                web.clean(d.get("unit"), 30) or "unité", num(d.get("cost_price")), num(d.get("sale_price")), int(bool(d.get("sellable"))),
                num(d.get("min_stock")), web.clean(d.get("supplier"), 120), web.clean(d.get("expiry_date"), 10), web.clean(d.get("location"), 60),
                web.clean(d.get("notes"), 500), int(bool(d.get("active", True))))
        if pid is None:
            pid = conn.execute("INSERT INTO products(name,brand,category,sku,unit,cost_price,sale_price,sellable,min_stock,supplier,expiry_date,location,notes,active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", vals).lastrowid
            if num(d.get("stock")) > 0:
                core.stock_move(conn, pid, num(d["stock"]), "reception", "", "Stock initial", num(d.get("cost_price")))
        else:
            conn.execute("UPDATE products SET name=?,brand=?,category=?,sku=?,unit=?,cost_price=?,sale_price=?,sellable=?,min_stock=?,supplier=?,expiry_date=?,location=?,notes=?,active=? WHERE id=?", (*vals, pid))
        conn.commit()
        return pid

    @app.post(P + "/products")
    @web.pro_required
    def a_product_create():
        return jsonify(id=_save_product(conn_(), None, web.body())), 201

    @app.put(P + "/products/<int:pid>")
    @web.pro_required
    def a_product_update(pid):
        if not row(conn_(), "SELECT 1 AS x FROM products WHERE id=?", (pid,)):
            abort(404)
        _save_product(conn_(), pid, web.body())
        return jsonify(ok=True)

    @app.delete(P + "/products/<int:pid>")
    @web.pro_required
    def a_product_delete(pid):
        conn_().execute("UPDATE products SET active=0 WHERE id=?", (pid,))  # archivé : l'historique des mouvements reste cohérent
        conn_().commit()
        return jsonify(archived=True)

    @app.post(P + "/products/<int:pid>/move")
    @web.pro_required
    def a_product_move(pid):
        conn, d = conn_(), web.body()
        p = row(conn, "SELECT * FROM products WHERE id=?", (pid,))
        if not p:
            abort(404)
        reason = d.get("reason")
        if reason not in ("reception", "loss", "return", "inventory", "usage"):
            abort(400, "Motif invalide.")
        qty = num(d.get("qty"), 0, 0)
        if reason == "inventory":  # inventaire : on saisit la quantité comptée
            delta = qty - p["stock"]
        else:
            if qty <= 0:
                abort(400, "Quantité invalide.")
            delta = qty if reason in ("reception", "return") else -qty
        if p["stock"] + delta < -0.0001:
            abort(409, "Le stock ne peut pas devenir négatif.")
        core.stock_move(conn, pid, delta, reason, "", web.clean(d.get("note"), 200), num(d.get("unit_cost"), p["cost_price"]) if reason == "reception" else None)
        if reason == "reception" and d.get("unit_cost") not in (None, ""):
            conn.execute("UPDATE products SET cost_price=? WHERE id=?", (num(d["unit_cost"]), pid))
        if reason == "reception" and d.get("expiry_date"):
            conn.execute("UPDATE products SET expiry_date=? WHERE id=?", (web.clean(d["expiry_date"], 10), pid))
        conn.commit()
        return jsonify(stock=row(conn, "SELECT stock FROM products WHERE id=?", (pid,))["stock"])

    @app.get(P + "/products/<int:pid>/movements")
    @web.pro_required
    def a_product_movements(pid):
        return jsonify(movements=rows(conn_(), "SELECT * FROM stock_movements WHERE product_id=? ORDER BY id DESC LIMIT 100", (pid,)))

    @app.post(P + "/sales")
    @web.pro_required
    def a_sale():
        """Vente de produit à une cliente : décrémente le stock, crée une facture réglée."""
        conn, d = conn_(), web.body()
        p = row(conn, "SELECT * FROM products WHERE id=? AND active=1 AND sellable=1", (d.get("product_id"),))
        cl = row(conn, "SELECT id FROM users WHERE id=? AND role='client' AND deleted=0", (d.get("client_id"),))
        qty = num(d.get("qty"), 1, 0.001)
        if not p or not cl:
            abort(400, "Produit ou cliente invalide.")
        if p["stock"] < qty:
            abort(409, "Stock insuffisant.")
        core.stock_move(conn, p["id"], -qty, "sale", "", "Vente cliente")
        total = round(p["sale_price"] * qty, 2)
        iid = conn.execute("INSERT INTO invoices(number,client_id,items,subtotal,discount,total,status,created_at) VALUES (?,?,?,?,0,?,'due',?)",
                           (core.next_number(conn, "invoices", "FAC"), cl["id"], jdump([{"label": p["name"], "qty": qty, "price": p["sale_price"]}]), total, total, now_iso())).lastrowid
        conn.execute("INSERT INTO client_products(client_id,product_id,qty,price,kind,created_at) VALUES (?,?,?,?,'sold',?)", (cl["id"], p["id"], qty, total, now_iso()))
        if d.get("paid", True):
            core.record_payment(conn, cl["id"], total, web.clean(d.get("method"), 30) or "carte", "payment", invoice_id=iid)
        conn.commit()
        return jsonify(invoice_id=iid), 201

    # ================================================================ diagnostics
    @app.get(P + "/diagnostics")
    @web.pro_required
    def a_diags():
        conn = conn_()
        out = rows(conn, "SELECT id,slug,name,category,active FROM diagnostics ORDER BY id")
        for d in out:
            d["rules"] = conn.execute("SELECT COUNT(*) FROM diagnostic_rules WHERE diagnostic_id=?", (d["id"],)).fetchone()[0]
            d["questions"] = len(jload(row(conn, "SELECT questions FROM diagnostics WHERE id=?", (d["id"],))["questions"], []))
        return jsonify(diagnostics=out, operators=engine.OPERATORS, verdicts=engine.VERDICT_ORDER,
                       verdict_defaults=engine.DEFAULT_VERDICT_TEXTS)

    @app.get(P + "/diagnostics/<int:did>")
    @web.pro_required
    def a_diag(did):
        conn = conn_()
        d = core.load_diagnostic(conn, diag_id=did, active_only=False)
        if not d:
            abort(404)
        rs = rows(conn, "SELECT * FROM diagnostic_rules WHERE diagnostic_id=? ORDER BY priority, id", (did,))
        for r in rs:
            r["condition"], r["action"] = jload(r["condition"], {}), jload(r["action"], {})
        return jsonify(diagnostic=d, rules=rs,
                       services=rows(conn, "SELECT id,slug,name,price FROM services WHERE active=1 ORDER BY category,name"))

    @app.post(P + "/diagnostics")
    @web.pro_required
    def a_diag_create():
        conn, d = conn_(), web.body()
        web.need(d, "name")
        slug = slugify(d["name"])
        while row(conn, "SELECT 1 AS x FROM diagnostics WHERE slug=?", (slug,)):
            slug += "-" + secrets.token_hex(2)
        src = core.load_diagnostic(conn, diag_id=d.get("duplicate_of"), active_only=False) if d.get("duplicate_of") else None
        qs = src["questions"] if src else [{"id": "question_1", "label": "Votre première question ?", "type": "yesno", "required": True,
                                           "options": [{"value": "yes", "label": "Oui"}, {"value": "no", "label": "Non"}]}]
        did = conn.execute("INSERT INTO diagnostics(slug,name,category,intro,questions,photo_slots,verdict_texts) VALUES (?,?,?,?,?,?,?)",
                           (slug, web.clean(d["name"], 120), web.clean(d.get("category"), 60), src["intro"] if src else "",
                            jdump(qs), jdump(src["photo_slots"] if src else []), jdump(src["verdict_texts"] if src else {}))).lastrowid
        if src:
            for r in rows(conn, "SELECT * FROM diagnostic_rules WHERE diagnostic_id=?", (src["id"],)):
                conn.execute("INSERT INTO diagnostic_rules(diagnostic_id,name,condition,action,priority,active) VALUES (?,?,?,?,?,?)",
                             (did, r["name"], r["condition"], r["action"], r["priority"], r["active"]))
        conn.commit()
        return jsonify(id=did), 201

    @app.put(P + "/diagnostics/<int:did>")
    @web.pro_required
    def a_diag_update(did):
        conn, d = conn_(), web.body()
        cur = core.load_diagnostic(conn, diag_id=did, active_only=False)
        if not cur:
            abort(404)
        qs = validate_questions(d.get("questions", cur["questions"]))
        slots = d.get("photo_slots", cur["photo_slots"])
        for s in slots:
            if not SLUG_RE.match(str(s.get("id", ""))) or not s.get("label"):
                abort(400, "Emplacement photo invalide.")
        vt = {k: {kk: web.clean(vv, 500) for kk, vv in v.items() if kk in ("title", "message")}
              for k, v in (d.get("verdict_texts", cur["verdict_texts"]) or {}).items() if k in engine.VERDICT_ORDER and isinstance(v, dict)}
        conn.execute("UPDATE diagnostics SET name=?,category=?,intro=?,questions=?,photo_slots=?,verdict_texts=?,active=? WHERE id=?",
                     (web.clean(d.get("name", cur["name"]), 120), web.clean(d.get("category", cur["category"]), 60), web.clean(d.get("intro", cur["intro"]), 1500),
                      jdump(qs), jdump(slots), jdump(vt), int(bool(d.get("active", cur["active"]))), did))
        conn.commit()
        return jsonify(ok=True)

    @app.delete(P + "/diagnostics/<int:did>")
    @web.pro_required
    def a_diag_delete(did):
        conn = conn_()
        if row(conn, "SELECT 1 AS x FROM submissions WHERE diagnostic_id=?", (did,)):
            conn.execute("UPDATE diagnostics SET active=0 WHERE id=?", (did,))
            conn.commit()
            return jsonify(archived=True)
        conn.execute("DELETE FROM diagnostics WHERE id=?", (did,))
        conn.commit()
        return jsonify(deleted=True)

    def _rule_payload(conn, did, d):
        diag = core.load_diagnostic(conn, diag_id=did, active_only=False)
        slugs = {s["slug"] for s in rows(conn, "SELECT slug FROM services")}
        web.need(d, "name")
        validate_condition(d.get("condition") or {}, {q["id"] for q in diag["questions"]})
        return (web.clean(d["name"], 160), jdump(d.get("condition") or {}), jdump(validate_action(d.get("action") or {}, slugs)),
                int(num(d.get("priority"), 100)), int(bool(d.get("active", True))))

    @app.post(P + "/diagnostics/<int:did>/rules")
    @web.pro_required
    def a_rule_create(did):
        conn = conn_()
        if not row(conn, "SELECT 1 AS x FROM diagnostics WHERE id=?", (did,)):
            abort(404)
        rid = conn.execute("INSERT INTO diagnostic_rules(diagnostic_id,name,condition,action,priority,active) VALUES (?,?,?,?,?,?)", (did, *_rule_payload(conn, did, web.body()))).lastrowid
        conn.commit()
        return jsonify(id=rid), 201

    @app.put(P + "/rules/<int:rid>")
    @web.pro_required
    def a_rule_update(rid):
        conn = conn_()
        r = row(conn, "SELECT * FROM diagnostic_rules WHERE id=?", (rid,))
        if not r:
            abort(404)
        conn.execute("UPDATE diagnostic_rules SET name=?,condition=?,action=?,priority=?,active=? WHERE id=?", (*_rule_payload(conn, r["diagnostic_id"], web.body()), rid))
        conn.commit()
        return jsonify(ok=True)

    @app.delete(P + "/rules/<int:rid>")
    @web.pro_required
    def a_rule_delete(rid):
        conn_().execute("DELETE FROM diagnostic_rules WHERE id=?", (rid,))
        conn_().commit()
        return jsonify(ok=True)

    @app.post(P + "/diagnostics/<int:did>/test")
    @web.pro_required
    def a_diag_test(did):
        """Simulateur : teste les règles enregistrées avec des réponses fictives."""
        conn, d = conn_(), web.body()
        diag = core.load_diagnostic(conn, diag_id=did, active_only=False)
        if not diag:
            abort(404)
        answers = core.sanitize_answers(diag, d.get("answers") or {})
        svc = row(conn, "SELECT * FROM services WHERE diagnostic_id=? AND active=1 ORDER BY id LIMIT 1", (did,))
        return jsonify(result=core.run_diagnostic(conn, diag, answers, svc))

    # ------------------------------------------------------------- dossiers de diagnostic
    @app.get(P + "/submissions")
    @web.pro_required
    def a_submissions():
        conn = conn_()
        flt = request.args.get("validation")
        sql = ("SELECT s.*, u.first_name, u.last_name, d.name AS diagnostic, d.questions AS dq, sv.name AS service FROM submissions s "
               "JOIN users u ON u.id=s.client_id JOIN diagnostics d ON d.id=s.diagnostic_id LEFT JOIN services sv ON sv.id=s.service_id ")
        subs = rows(conn, sql + ("WHERE s.validation=? " if flt else "") + "ORDER BY s.id DESC LIMIT 200", (flt,) if flt else ())
        for s in subs:
            s["answers"], s["photos"], s["result"] = jload(s["answers"], {}), jload(s["photos"], []), jload(s["result"], {})
            qs = {q["id"]: q for q in jload(s.pop("dq"), [])}
            s["qa"] = []
            for qid, v in s["answers"].items():
                q = qs.get(qid)
                if not q:
                    continue
                labels = {o["value"]: o["label"] for o in q.get("options", [])}
                vals = v if isinstance(v, list) else [v]
                s["qa"].append({"q": q["label"], "a": ", ".join(labels.get(x, x) for x in vals)})
        return jsonify(submissions=subs)

    @app.post(P + "/submissions/<int:sid>/review")
    @web.pro_required
    def a_submission_review(sid):
        conn, d = conn_(), web.body()
        s = row(conn, "SELECT * FROM submissions WHERE id=?", (sid,))
        if not s:
            abort(404)
        if d.get("validation") not in ("approved", "declined"):
            abort(400, "Décision invalide.")
        conn.execute("UPDATE submissions SET validation=?, pro_comment=? WHERE id=?", (d["validation"], web.clean(d.get("comment"), 1000), sid))
        for a in rows(conn, "SELECT * FROM appointments WHERE submission_id=? AND status='demande'", (sid,)):
            new = "confirme" if d["validation"] == "approved" else "annule"
            if new == "confirme" and a["deposit"] > 0 and not a["deposit_paid"]:
                new = "en_attente"
            core.set_status(conn, a["id"], new)
        conn.commit()
        return jsonify(ok=True)

    # ===================================================================== devis
    @app.get(P + "/quotes")
    @web.pro_required
    def a_quotes():
        conn = conn_()
        out = []
        for q in rows(conn, "SELECT q.*, u.first_name, u.last_name FROM quotes q JOIN users u ON u.id=q.client_id ORDER BY q.id DESC LIMIT 300"):
            o = core.quote_out(q)
            out.append(o)
        return jsonify(quotes=out)

    def _items(d):
        items = []
        for i in d.get("items") or []:
            label = web.clean(i.get("label"), 160)
            if label:
                items.append({"label": label, "price": num(i.get("price")), "qty": num(i.get("qty"), 1, 0.01), "service_id": i.get("service_id")})
        if not items:
            abort(400, "Ajoutez au moins une ligne au devis.")
        return items

    @app.post(P + "/quotes")
    @web.pro_required
    def a_quote_create():
        conn, d = conn_(), web.body()
        if not row(conn, "SELECT 1 AS x FROM users WHERE id=? AND role='client'", (d.get("client_id"),)):
            abort(400, "Cliente invalide.")
        qid = core.create_quote(conn, d["client_id"], _items(d), d.get("steps") or [], notes=web.clean(d.get("notes"), 1000))
        if d.get("valid_until"):
            conn.execute("UPDATE quotes SET valid_until=? WHERE id=?", (web.clean(d["valid_until"], 10), qid))
        conn.commit()
        return jsonify(id=qid), 201

    @app.put(P + "/quotes/<int:qid>")
    @web.pro_required
    def a_quote_update(qid):
        conn, d = conn_(), web.body()
        q = row(conn, "SELECT * FROM quotes WHERE id=?", (qid,))
        if not q:
            abort(404)
        if q["status"] == "converted":
            abort(409, "Un devis converti en rendez-vous ne peut plus être modifié.")
        items = _items(d)
        conn.execute("UPDATE quotes SET items=?, steps=?, total=?, notes=?, valid_until=?, status=CASE WHEN status IN ('accepted','refused') THEN 'sent' ELSE status END WHERE id=?",
                     (jdump(items), jdump(d.get("steps", jload(q["steps"], []))), round(sum(i["price"] * i["qty"] for i in items), 2),
                      web.clean(d.get("notes", q["notes"]), 1000), web.clean(d.get("valid_until", q["valid_until"]), 10), qid))
        conn.commit()
        return jsonify(ok=True)

    @app.post(P + "/quotes/<int:qid>/send")
    @web.pro_required
    def a_quote_send(qid):
        conn = conn_()
        q = row(conn, "SELECT * FROM quotes WHERE id=?", (qid,))
        if not q:
            abort(404)
        cl = row(conn, "SELECT * FROM users WHERE id=?", (q["client_id"],))
        if not cl["email"]:
            abort(409, "Cette cliente n'a pas d'adresse email.")
        inst = core.setting(conn, "institute", {})
        link = request.host_url.rstrip("/") + f"/devis/{q['token']}"
        notify.queue(conn, cl["id"], "quote", f"Votre devis {q['number']} — {inst.get('name', '')}",
                     f"Bonjour {cl['first_name']},\n\nVous trouverez votre devis {q['number']} (total {q['total']:.2f} €, valable jusqu'au {q['valid_until']}) à l'adresse suivante, où vous pouvez le consulter, le télécharger en PDF, l'accepter ou le refuser :\n{link}\n\nÀ bientôt,\n{inst.get('name', '')}")
        conn.execute("UPDATE quotes SET status=CASE WHEN status IN ('draft') THEN 'sent' ELSE status END, sent_at=? WHERE id=?", (now_iso(), qid))
        notify.process_outbox(conn)
        conn.commit()
        return jsonify(ok=True, link=link)

    @app.post(P + "/quotes/<int:qid>/convert")
    @web.pro_required
    def a_quote_convert(qid):
        conn, d = conn_(), web.body()
        q = row(conn, "SELECT * FROM quotes WHERE id=?", (qid,))
        if not q or q["status"] in ("refused", "converted"):
            abort(409, "Ce devis ne peut pas être converti.")
        items = jload(q["items"], [])
        sid = d.get("service_id") or next((i.get("service_id") for i in items if i.get("service_id")), None)
        svc = row(conn, "SELECT * FROM services WHERE id=?", (sid,))
        if not svc:
            abort(400, "Choisissez la prestation à planifier.")
        try:
            start = datetime.fromisoformat(d.get("start", ""))
        except ValueError:
            abort(400, "Date invalide.")
        aid = core.create_appointment(conn, q["client_id"], svc, start, status="confirme", source="manual", quote_id=qid,
                                      submission_id=q["submission_id"], check=not d.get("force"))
        conn.execute("UPDATE quotes SET status='converted', answered_at=? WHERE id=?", (now_iso(), qid))
        conn.commit()
        return jsonify(appointment_id=aid)

    @app.post(P + "/quotes/<int:qid>/status")
    @web.pro_required
    def a_quote_status(qid):
        conn, d = conn_(), web.body()
        if d.get("status") not in ("draft", "sent", "accepted", "refused"):
            abort(400, "Statut invalide.")
        conn.execute("UPDATE quotes SET status=?, answered_at=? WHERE id=? AND status<>'converted'", (d["status"], now_iso(), qid))
        conn.commit()
        return jsonify(ok=True)

    @app.delete(P + "/quotes/<int:qid>")
    @web.pro_required
    def a_quote_delete(qid):
        conn = conn_()
        if not row(conn, "SELECT 1 AS x FROM quotes WHERE id=? AND status IN ('draft','refused')", (qid,)):
            abort(409, "Seuls les devis brouillons ou refusés peuvent être supprimés.")
        conn.execute("UPDATE appointments SET quote_id=NULL WHERE quote_id=?", (qid,))
        conn.execute("DELETE FROM quotes WHERE id=?", (qid,))
        conn.commit()
        return jsonify(ok=True)

    @app.get(P + "/quotes/<int:qid>.pdf")
    @web.pro_required
    def a_quote_pdf(qid):
        q = row(conn_(), "SELECT * FROM quotes WHERE id=?", (qid,))
        if not q:
            abort(404)
        return app.quote_pdf(conn_(), q)

    # ====================================================== factures et paiements
    @app.get(P + "/invoices")
    @web.pro_required
    def a_invoices():
        conn = conn_()
        invs = rows(conn, "SELECT i.*, u.first_name, u.last_name FROM invoices i JOIN users u ON u.id=i.client_id ORDER BY i.id DESC LIMIT 300")
        for i in invs:
            i["items"] = jload(i["items"], [])
            i["paid"] = core.invoice_paid(conn, i["id"])
        return jsonify(invoices=invs)

    @app.get(P + "/invoices/<int:iid>.pdf")
    @web.pro_required
    def a_invoice_pdf(iid):
        inv = row(conn_(), "SELECT * FROM invoices WHERE id=?", (iid,))
        if not inv:
            abort(404)
        return invoice_pdf(conn_(), inv)

    @app.post(P + "/invoices/<int:iid>/payments")
    @web.pro_required
    def a_invoice_pay(iid):
        conn, d = conn_(), web.body()
        inv = row(conn, "SELECT * FROM invoices WHERE id=?", (iid,))
        if not inv or inv["status"] == "void":
            abort(404)
        amount = round(num(d.get("amount")), 2)
        remaining = round(inv["total"] - core.invoice_paid(conn, iid), 2)
        if amount <= 0 or amount > remaining + 0.005:
            abort(400, f"Montant invalide (reste à payer : {remaining:.2f} €).")
        core.record_payment(conn, inv["client_id"], amount, web.clean(d.get("method"), 30) or "carte", "payment", invoice_id=iid, appointment_id=inv["appointment_id"])
        conn.commit()
        return jsonify(ok=True)

    @app.post(P + "/invoices/<int:iid>/redeem")
    @web.pro_required
    def a_invoice_redeem(iid):
        conn = conn_()
        v = core.redeem_reward(conn, iid)
        conn.commit()
        return jsonify(discount=v)

    @app.post(P + "/invoices/<int:iid>/void")
    @web.pro_required
    def a_invoice_void(iid):
        conn = conn_()
        if conn.execute("SELECT COUNT(*) FROM payments WHERE invoice_id=?", (iid,)).fetchone()[0]:
            abort(409, "Cette facture a des paiements : remboursez-les avant de l'annuler.")
        conn.execute("UPDATE invoices SET status='void' WHERE id=?", (iid,))
        conn.commit()
        return jsonify(ok=True)

    # ================================================================ photos avant/après
    @app.post(P + "/photos")
    @web.pro_required
    def a_photo_add():
        conn, d = conn_(), web.body()
        cl = row(conn, "SELECT * FROM users WHERE id=? AND role='client' AND deleted=0", (d.get("client_id"),))
        if not cl or d.get("kind") not in ("before", "after"):
            abort(400, "Cliente ou type de photo invalide.")
        marketing = bool(d.get("marketing_ok"))
        if marketing and not cl["consent_photos"]:
            abort(409, "La cliente n'a pas donné son consentement pour l'utilisation marketing de ses photos.")
        name = web.save_image(d.get("image"))
        taken = web.clean(d.get("taken_on"), 10) or date.today().isoformat()
        conn.execute("INSERT INTO ba_photos(client_id,appointment_id,service_id,kind,file,taken_on,comment,marketing_ok,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                     (cl["id"], d.get("appointment_id") or None, d.get("service_id") or None, d["kind"], name, taken, web.clean(d.get("comment"), 500), int(marketing), now_iso()))
        conn.commit()
        return jsonify(ok=True), 201

    @app.put(P + "/photos/<int:pid>")
    @web.pro_required
    def a_photo_update(pid):
        conn, d = conn_(), web.body()
        p = row(conn, "SELECT p.*, u.consent_photos FROM ba_photos p JOIN users u ON u.id=p.client_id WHERE p.id=?", (pid,))
        if not p:
            abort(404)
        marketing = bool(d.get("marketing_ok", p["marketing_ok"]))
        if marketing and not p["consent_photos"]:
            abort(409, "Consentement de la cliente manquant.")
        conn.execute("UPDATE ba_photos SET comment=?, marketing_ok=?, service_id=?, appointment_id=? WHERE id=?",
                     (web.clean(d.get("comment", p["comment"]), 500), int(marketing), d.get("service_id", p["service_id"]), d.get("appointment_id", p["appointment_id"]), pid))
        conn.commit()
        return jsonify(ok=True)

    @app.delete(P + "/photos/<int:pid>")
    @web.pro_required
    def a_photo_delete(pid):
        conn = conn_()
        p = row(conn, "SELECT file FROM ba_photos WHERE id=?", (pid,))
        if p:
            from client_api import _remove_private
            _remove_private(p["file"])
            conn.execute("DELETE FROM ba_photos WHERE id=?", (pid,))
            conn.commit()
        return jsonify(ok=True)

    @app.get(P + "/gallery")
    @web.pro_required
    def a_gallery():
        """Photos utilisables en marketing (consentement photo actif + autorisation sur la photo)."""
        return jsonify(photos=rows(conn_(), "SELECT b.id,b.kind,b.taken_on,b.comment,b.appointment_id,sv.name AS service FROM ba_photos b JOIN users u ON u.id=b.client_id "
                                              "LEFT JOIN services sv ON sv.id=b.service_id WHERE b.marketing_ok=1 AND u.consent_photos=1 ORDER BY b.taken_on DESC"))

    # ======================================================================= avis
    @app.get(P + "/reviews")
    @web.pro_required
    def a_reviews():
        return jsonify(reviews=rows(conn_(), "SELECT r.*, sv.name AS service FROM reviews r LEFT JOIN services sv ON sv.id=r.service_id ORDER BY (r.status='pending') DESC, r.id DESC LIMIT 300"))

    @app.post(P + "/reviews/<int:rid>/status")
    @web.pro_required
    def a_review_status(rid):
        conn, d = conn_(), web.body()
        if d.get("status") not in ("published", "hidden", "pending"):
            abort(400, "Statut invalide.")
        conn.execute("UPDATE reviews SET status=? WHERE id=?", (d["status"], rid))
        conn.commit()
        return jsonify(ok=True)

    @app.delete(P + "/reviews/<int:rid>")
    @web.pro_required
    def a_review_delete(rid):
        conn_().execute("DELETE FROM reviews WHERE id=?", (rid,))
        conn_().commit()
        return jsonify(ok=True)

    # =================================================================== statistiques
    @app.get(P + "/stats")
    @web.pro_required
    def a_stats():
        conn = conn_()
        months = max(1, min(24, int(request.args.get("months", 6))))
        today = date.today()
        first = today.replace(day=1)
        labels = []
        y, m = first.year, first.month
        for _ in range(months):
            labels.append(f"{y}-{m:02d}")
            m -= 1
            if m == 0:
                y, m = y - 1, 12
        labels.reverse()
        since = labels[0] + "-01"
        rev = {r["m"]: r["t"] for r in rows(conn, "SELECT substr(created_at,1,7) m, SUM(CASE WHEN kind='refund' THEN -amount ELSE amount END) t FROM payments WHERE created_at>=? GROUP BY m", (since,))}
        newc = {r["m"]: r["n"] for r in rows(conn, "SELECT substr(created_at,1,7) m, COUNT(*) n FROM users WHERE role='client' AND created_at>=? GROUP BY m", (since,))}
        apm = {r["m"]: r["n"] for r in rows(conn, "SELECT substr(start,1,7) m, COUNT(*) n FROM appointments WHERE status='termine' AND start>=? GROUP BY m", (since,))}
        by_status = {r["status"]: r["n"] for r in rows(conn, "SELECT status, COUNT(*) n FROM appointments WHERE start>=? AND start<? GROUP BY status", (since, now_iso()))}
        top = rows(conn, "SELECT sv.name, COUNT(*) n, SUM(a.price) revenue FROM appointments a JOIN services sv ON sv.id=a.service_id WHERE a.status='termine' AND a.start>=? GROUP BY sv.id ORDER BY revenue DESC LIMIT 8", (since,))
        cats = rows(conn, "SELECT sv.category name, COUNT(*) n, SUM(a.price) revenue FROM appointments a JOIN services sv ON sv.id=a.service_id WHERE a.status='termine' AND a.start>=? GROUP BY sv.category ORDER BY revenue DESC", (since,))
        done = by_status.get("termine", 0)
        past = sum(by_status.get(k, 0) for k in ("termine", "no_show", "annule"))
        # taux d'occupation sur les 30 derniers jours
        d30 = (today - timedelta(days=30))
        booked = conn.execute("SELECT COALESCE(SUM((julianday(end)-julianday(start))*24*60),0) FROM appointments WHERE status='termine' AND start>=? AND start<?", (d30.isoformat(), today.isoformat())).fetchone()[0]
        avail = 0
        for i in range(30):
            avail += sum((core._hm(d30, b) - core._hm(d30, a)).total_seconds() / 60 for a, b in core.setting(conn, "opening_hours", {}).get(str((d30 + timedelta(days=i)).weekday()), []))
        repeat = conn.execute("SELECT COUNT(*) FROM (SELECT client_id FROM appointments WHERE status='termine' GROUP BY client_id HAVING COUNT(*)>=2)").fetchone()[0]
        total_clients = conn.execute("SELECT COUNT(*) FROM users WHERE role='client' AND deleted=0").fetchone()[0]
        total_rev = sum(rev.values())
        stock_value = conn.execute("SELECT COALESCE(SUM(stock*cost_price),0) FROM products WHERE active=1").fetchone()[0]
        return jsonify(
            months=labels, revenue=[round(rev.get(l, 0), 2) for l in labels], new_clients=[newc.get(l, 0) for l in labels],
            visits=[apm.get(l, 0) for l in labels], by_status=by_status, top_services=top, by_category=cats,
            no_show_rate=round(by_status.get("no_show", 0) / past * 100, 1) if past else 0,
            cancel_rate=round(by_status.get("annule", 0) / past * 100, 1) if past else 0,
            avg_basket=round(total_rev / done, 2) if done else 0, occupancy=round(booked / avail * 100, 1) if avail else 0,
            repeat_rate=round(repeat / total_clients * 100, 1) if total_clients else 0, total_clients=total_clients, stock_value=round(stock_value, 2))

    # =============================================================== communications
    @app.get(P + "/outbox")
    @web.pro_required
    def a_outbox():
        return jsonify(messages=rows(conn_(), "SELECT o.*, u.first_name, u.last_name FROM outbox o LEFT JOIN users u ON u.id=o.client_id ORDER BY o.send_at DESC LIMIT 200"),
                       smtp=bool(notify.SMTP_HOST))

    @app.post(P + "/messages")
    @web.pro_required
    def a_message():
        conn, d = conn_(), web.body()
        cl = row(conn, "SELECT * FROM users WHERE id=? AND role='client' AND deleted=0", (d.get("client_id"),))
        if not cl:
            abort(400, "Cliente invalide.")
        web.need(d, "subject", "body")
        notify.queue(conn, cl["id"], "custom", web.clean(d["subject"], 160), web.clean(d["body"], 4000))
        notify.process_outbox(conn)
        conn.commit()
        return jsonify(ok=True), 201

    @app.delete(P + "/outbox/<int:mid>")
    @web.pro_required
    def a_outbox_cancel(mid):
        conn_().execute("UPDATE outbox SET status='cancelled' WHERE id=? AND status='pending'", (mid,))
        conn_().commit()
        return jsonify(ok=True)

    # ===================================================================== paramètres
    @app.get(P + "/settings")
    @web.pro_required
    def a_settings():
        conn = conn_()
        return jsonify(settings={r["key"]: jload(r["value"]) for r in rows(conn, "SELECT * FROM settings")},
                       smtp=bool(notify.SMTP_HOST))

    @app.put(P + "/settings/<key>")
    @web.pro_required
    def a_setting_put(key):
        conn, d = conn_(), web.body()
        if key not in ("institute", "opening_hours", "booking", "loyalty", "reminders", "marketing"):
            abort(404)
        val = d.get("value")
        if key == "opening_hours":
            clean_hours = {}
            for k in map(str, range(7)):
                spans = []
                for span in (val or {}).get(k, []):
                    a, b = span
                    if not (re.match(r"^\d\d:\d\d$", a) and re.match(r"^\d\d:\d\d$", b)) or a >= b:
                        abort(400, "Horaires invalides (début < fin, format HH:MM).")
                    spans.append([a, b])
                clean_hours[k] = spans
            val = clean_hours
        elif key == "booking":
            cur = core.setting(conn, "booking", {})
            val = {**cur, **{k: val[k] for k in cur if k in val}}
            val["slot_step"] = int(num(val["slot_step"], 30, 5))
            if val["slot_step"] not in (5, 10, 15, 20, 30, 45, 60):
                abort(400, "Pas de créneau invalide.")
        elif key in ("institute", "loyalty", "reminders", "marketing"):
            cur = core.setting(conn, key, {})
            val = {**cur, **{k: val[k] for k in cur if k in (val or {})}}
        core.set_setting(conn, key, val)
        conn.commit()
        return jsonify(ok=True)

    @app.post(P + "/upload")
    @web.pro_required
    def a_upload():
        """Image publique (photo de prestation, bannière d'accueil)."""
        name = web.save_image(web.body().get("image"), private=False)
        return jsonify(url=f"/media/public/{name}"), 201

    @app.post(P + "/password")
    @web.pro_required
    def a_password():
        conn, u, d = conn_(), web.current_user(), web.body()
        if not check_password_hash(u["pw_hash"], d.get("current") or ""):
            abort(400, "Mot de passe actuel incorrect.")
        if len(d.get("new") or "") < 10:
            abort(400, "Le nouveau mot de passe doit contenir au moins 10 caractères.")
        conn.execute("UPDATE users SET pw_hash=? WHERE id=?", (generate_password_hash(d["new"]), u["id"]))
        conn.commit()
        return jsonify(ok=True)
