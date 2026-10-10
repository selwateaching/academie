"""Logique métier : disponibilités, rendez-vous, devis, factures, stocks, fidélité."""

import secrets
from datetime import date, datetime, timedelta

import notify
from db import jdump, jload, now_iso, row, rows

STATUSES = ["demande", "confirme", "en_attente", "arrive", "en_cours", "termine", "annule", "no_show"]
STATUS_LABELS = {
    "demande": "Demande", "confirme": "Confirmé", "en_attente": "En attente", "arrive": "Arrivé",
    "en_cours": "En cours", "termine": "Terminé", "annule": "Annulé", "no_show": "No-show",
}
BUSY_STATUSES = ("demande", "confirme", "en_attente", "arrive", "en_cours", "termine")
ACTIVE_FUTURE = ("demande", "confirme", "en_attente", "arrive", "en_cours")


class BookingError(ValueError):
    pass


def setting(conn, key, default=None):
    return notify.get_setting(conn, key, default)


def set_setting(conn, key, value):
    conn.execute("INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                 (key, jdump(value)))


def dt(s):
    return datetime.fromisoformat(s)


def iso(d):
    return d.isoformat(timespec="minutes")


def _hm(day, hm):
    h, m = hm.split(":")
    return datetime(day.year, day.month, day.day, int(h), int(m))


# ------------------------------------------------------------ disponibilités
def day_windows(conn, day):
    """Plages d'ouverture d'un jour (horaires habituels + ouvertures exceptionnelles)."""
    hours = setting(conn, "opening_hours", {})
    wins = [(_hm(day, a), _hm(day, b)) for a, b in hours.get(str(day.weekday()), [])]
    d0, d1 = datetime.combine(day, datetime.min.time()), datetime.combine(day, datetime.max.time())
    for b in rows(conn, "SELECT * FROM blocks WHERE kind='open' AND start<=? AND end>=?", (iso(d1), iso(d0))):
        wins.append((max(dt(b["start"]), d0), min(dt(b["end"]), d1)))
    return sorted(wins)


def busy_intervals(conn, day, exclude_appt=None):
    d0, d1 = datetime.combine(day, datetime.min.time()) - timedelta(hours=6), datetime.combine(day, datetime.max.time()) + timedelta(hours=6)
    out = []
    q = "SELECT * FROM appointments WHERE status IN (%s) AND start<=? AND end>=?" % ",".join("?" * len(BUSY_STATUSES))
    for a in rows(conn, q, (*BUSY_STATUSES, iso(d1), iso(d0))):
        if a["id"] == exclude_appt:
            continue
        out.append((dt(a["start"]) - timedelta(minutes=a["prep"]), dt(a["end"]) + timedelta(minutes=a["cleanup"])))
    for b in rows(conn, "SELECT * FROM blocks WHERE kind IN ('block','leave') AND start<=? AND end>=?", (iso(d1), iso(d0))):
        out.append((dt(b["start"]), dt(b["end"])))
    return out


def is_free(conn, start, svc, exclude_appt=None):
    """Le créneau (avec préparation et nettoyage) est-il libre et dans les horaires ?"""
    s0 = start - timedelta(minutes=svc["prep_time"])
    s1 = start + timedelta(minutes=svc["duration"] + svc["cleanup_time"])
    if not any(w0 <= s0 and s1 <= w1 for w0, w1 in day_windows(conn, start.date())):
        return False
    return not any(s0 < b1 and s1 > b0 for b0, b1 in busy_intervals(conn, start.date(), exclude_appt))


def slots_for_day(conn, svc, day, exclude_appt=None):
    bk = setting(conn, "booking", {})
    step = int(bk.get("slot_step", 30))
    earliest = datetime.now() + timedelta(hours=bk.get("min_notice_hours", 12))
    if day > date.today() + timedelta(days=bk.get("max_days_ahead", 90)):
        return []
    out = []
    for w0, w1 in day_windows(conn, day):
        t = w0 + timedelta(minutes=svc["prep_time"])
        while t + timedelta(minutes=svc["duration"] + svc["cleanup_time"]) <= w1:
            if t >= earliest and is_free(conn, t, svc, exclude_appt):
                out.append(t.strftime("%H:%M"))
            t += timedelta(minutes=step)
    return sorted(set(out))


def availability(conn, svc, start_day, days):
    res = {}
    for i in range(days):
        d = start_day + timedelta(days=i)
        res[d.isoformat()] = slots_for_day(conn, svc, d)
    return res


# --------------------------------------------------------------- rendez-vous
def create_appointment(conn, client_id, svc, start, status=None, source="online", notes="", price=None,
                       quote_id=None, submission_id=None, check=True, force_status=None):
    if check and not is_free(conn, start, svc):
        raise BookingError("Ce créneau n'est plus disponible.")
    bk = setting(conn, "booking", {})
    if status is None:
        status = "confirme" if bk.get("auto_confirm", True) else "en_attente"
    deposit = svc["deposit"] or 0
    end = start + timedelta(minutes=svc["duration"])
    cur = conn.execute(
        "INSERT INTO appointments(client_id,service_id,start,end,prep,cleanup,status,price,deposit,notes,quote_id,submission_id,source,created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (client_id, svc["id"], iso(start), iso(end), svc["prep_time"], svc["cleanup_time"], status,
         svc["price"] if price is None else price, deposit, notes, quote_id, submission_id, source, now_iso()))
    notify.schedule_for_appointment(conn, cur.lastrowid)
    return cur.lastrowid


def move_appointment(conn, appt_id, new_start, check=True):
    a = row(conn, "SELECT * FROM appointments WHERE id=?", (appt_id,))
    svc = row(conn, "SELECT * FROM services WHERE id=?", (a["service_id"],))
    dur = dt(a["end"]) - dt(a["start"])
    probe = {**svc, "duration": int(dur.total_seconds() // 60), "prep_time": a["prep"], "cleanup_time": a["cleanup"]}
    if check and not is_free(conn, new_start, probe, exclude_appt=appt_id):
        raise BookingError("Ce créneau n'est pas disponible.")
    conn.execute("UPDATE appointments SET start=?, end=? WHERE id=?", (iso(new_start), iso(new_start + dur), appt_id))
    notify.schedule_for_appointment(conn, appt_id)


def set_status(conn, appt_id, status, send=True):
    """Change le statut ; applique les effets (rappels, facture, stock) associés."""
    if status not in STATUSES:
        raise ValueError("Statut inconnu")
    prev = row(conn, "SELECT status FROM appointments WHERE id=?", (appt_id,))["status"]
    conn.execute("UPDATE appointments SET status=? WHERE id=?", (status, appt_id))
    if status in ("annule", "no_show", "termine"):
        notify.cancel_for_appointment(conn, appt_id)
    elif send and prev != status and status in ("confirme", "demande", "en_attente"):
        notify.schedule_for_appointment(conn, appt_id)
    if status == "termine" and prev != "termine":
        complete_appointment(conn, appt_id, send=send)
    return status


def complete_appointment(conn, appt_id, send=True):
    a = row(conn, "SELECT * FROM appointments WHERE id=?", (appt_id,))
    svc = row(conn, "SELECT * FROM services WHERE id=?", (a["service_id"],))
    # produits consommés -> stock + historique cliente (une seule fois par rendez-vous)
    if not row(conn, "SELECT 1 AS x FROM stock_movements WHERE ref=? AND reason='usage'", (f"appt:{appt_id}",)):
        for sp in rows(conn, "SELECT * FROM service_products WHERE service_id=?", (svc["id"],)):
            stock_move(conn, sp["product_id"], -sp["qty"], "usage", f"appt:{appt_id}", f"Prestation {svc['name']}")
            conn.execute("INSERT INTO client_products(client_id,product_id,qty,price,kind,appointment_id,created_at) VALUES (?,?,?,?,?,?,?)",
                         (a["client_id"], sp["product_id"], sp["qty"], 0, "used", appt_id, now_iso()))
    ensure_invoice(conn, appt_id)
    if send:
        cfg = setting(conn, "reminders", {})
        if cfg.get("thanks", True):
            ctx = notify._ctx(conn, a)
            subj, body = notify.TEMPLATES["thanks"]
            notify.queue(conn, a["client_id"], "thanks", subj.format(**ctx), body.format(**ctx),
                         (datetime.now() + timedelta(hours=cfg.get("thanks_delay_hours", 3))).replace(microsecond=0).isoformat(), appt_id)


def stock_move(conn, product_id, delta, reason, ref="", note="", unit_cost=None):
    conn.execute("UPDATE products SET stock=ROUND(stock+?,3) WHERE id=?", (delta, product_id))
    conn.execute("INSERT INTO stock_movements(product_id,delta,reason,ref,note,unit_cost,created_at) VALUES (?,?,?,?,?,?,?)",
                 (product_id, delta, reason, ref, note, unit_cost, now_iso()))


# ------------------------------------------------------------------- devis
def next_number(conn, table, prefix):
    year = date.today().year
    n = conn.execute(f"SELECT COUNT(*) FROM {table} WHERE number LIKE ?", (f"{prefix}-{year}-%",)).fetchone()[0] + 1
    return f"{prefix}-{year}-{n:04d}"


def create_quote(conn, client_id, items, steps=None, submission_id=None, notes="", status="draft"):
    bk = setting(conn, "booking", {})
    valid = date.today() + timedelta(days=bk.get("quote_validity_days", 30))
    total = round(sum(i["price"] * i.get("qty", 1) for i in items), 2)
    cur = conn.execute(
        "INSERT INTO quotes(number,token,client_id,submission_id,items,steps,total,status,valid_until,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        (next_number(conn, "quotes", "DEV"), secrets.token_urlsafe(18), client_id, submission_id,
         jdump(items), jdump(steps or []), total, status, valid.isoformat(), notes, now_iso()))
    return cur.lastrowid


def quote_out(q):
    """Quote prête pour l'API (JSON décodé, expiration calculée)."""
    q = dict(q)
    q["items"] = jload(q["items"], [])
    q["steps"] = jload(q["steps"], [])
    q["expired"] = q["status"] in ("draft", "sent") and q["valid_until"] < date.today().isoformat()
    q["effective_status"] = "expired" if q["expired"] else q["status"]
    return q


# ----------------------------------------------------------- factures, paiements
def ensure_invoice(conn, appt_id):
    inv = row(conn, "SELECT * FROM invoices WHERE appointment_id=?", (appt_id,))
    if inv:
        return inv["id"]
    a = row(conn, "SELECT * FROM appointments WHERE id=?", (appt_id,))
    svc = row(conn, "SELECT name FROM services WHERE id=?", (a["service_id"],))
    items = [{"label": svc["name"], "qty": 1, "price": a["price"]}]
    cur = conn.execute(
        "INSERT INTO invoices(number,client_id,appointment_id,items,subtotal,discount,total,status,created_at) VALUES (?,?,?,?,?,0,?,'due',?)",
        (next_number(conn, "invoices", "FAC"), a["client_id"], appt_id, jdump(items), a["price"], a["price"], now_iso()))
    paid_deposit = conn.execute("SELECT COALESCE(SUM(amount),0) FROM payments WHERE appointment_id=? AND invoice_id IS NULL", (appt_id,)).fetchone()[0]
    if paid_deposit:
        conn.execute("UPDATE payments SET invoice_id=? WHERE appointment_id=? AND invoice_id IS NULL", (cur.lastrowid, appt_id))
    refresh_invoice_status(conn, cur.lastrowid)
    return cur.lastrowid


def invoice_paid(conn, invoice_id):
    return conn.execute("SELECT COALESCE(SUM(amount),0) FROM payments WHERE invoice_id=?", (invoice_id,)).fetchone()[0]


def refresh_invoice_status(conn, invoice_id):
    inv = row(conn, "SELECT * FROM invoices WHERE id=?", (invoice_id,))
    if inv["status"] == "void":
        return
    paid = invoice_paid(conn, invoice_id)
    status = "paid" if paid >= inv["total"] - 0.005 else ("partial" if paid > 0 else "due")
    conn.execute("UPDATE invoices SET status=? WHERE id=?", (status, invoice_id))


def record_payment(conn, client_id, amount, method="carte", kind="payment", invoice_id=None, appointment_id=None, note=""):
    cur = conn.execute(
        "INSERT INTO payments(client_id,invoice_id,appointment_id,amount,method,kind,note,created_at) VALUES (?,?,?,?,?,?,?,?)",
        (client_id, invoice_id, appointment_id, amount, method, kind, note, now_iso()))
    if invoice_id:
        refresh_invoice_status(conn, invoice_id)
    if kind != "refund" and amount > 0:
        pts = int(amount * setting(conn, "loyalty", {}).get("points_per_euro", 1))
        if pts:
            loyalty_adjust(conn, client_id, pts, "Paiement", f"pay:{cur.lastrowid}")
    if kind == "deposit" and appointment_id:
        conn.execute("UPDATE appointments SET deposit_paid=1 WHERE id=?", (appointment_id,))
    return cur.lastrowid


def loyalty_adjust(conn, client_id, points, reason, ref=""):
    conn.execute("UPDATE users SET loyalty_points=MAX(0, loyalty_points+?) WHERE id=?", (points, client_id))
    conn.execute("INSERT INTO loyalty_ledger(client_id,points,reason,ref,created_at) VALUES (?,?,?,?,?)",
                 (client_id, points, reason, ref, now_iso()))


def redeem_reward(conn, invoice_id):
    cfg = setting(conn, "loyalty", {})
    inv = row(conn, "SELECT * FROM invoices WHERE id=?", (invoice_id,))
    cl = row(conn, "SELECT * FROM users WHERE id=?", (inv["client_id"],))
    need, value = cfg.get("reward_points", 100), cfg.get("reward_value", 5)
    if cl["loyalty_points"] < need:
        raise ValueError("Points insuffisants")
    if inv["status"] in ("paid", "void") or inv["total"] <= 0:
        raise ValueError("Facture non éligible")
    value = min(value, inv["total"])
    conn.execute("UPDATE invoices SET discount=discount+?, total=total-? WHERE id=?", (value, value, invoice_id))
    loyalty_adjust(conn, cl["id"], -need, "Récompense utilisée", f"inv:{invoice_id}")
    refresh_invoice_status(conn, invoice_id)
    return value


# ------------------------------------------------------------------ diagnostic
def load_diagnostic(conn, slug=None, diag_id=None, active_only=True):
    q, arg = ("SELECT * FROM diagnostics WHERE slug=?", slug) if slug else ("SELECT * FROM diagnostics WHERE id=?", diag_id)
    d = row(conn, q, (arg,))
    if not d or (active_only and not d["active"]):
        return None
    d["questions"] = jload(d["questions"], [])
    d["photo_slots"] = jload(d["photo_slots"], [])
    d["verdict_texts"] = jload(d["verdict_texts"], {})
    return d


def run_diagnostic(conn, diagnostic, answers, requested_service=None):
    import engine
    rules = []
    for r in rows(conn, "SELECT * FROM diagnostic_rules WHERE diagnostic_id=? AND active=1", (diagnostic["id"],)):
        r["condition"] = jload(r["condition"], {})
        r["action"] = jload(r["action"], {})
        rules.append(r)
    by_slug = {s["slug"]: s for s in rows(conn, "SELECT * FROM services WHERE active=1")}
    return engine.evaluate(diagnostic, rules, answers, by_slug, requested_service)


def sanitize_answers(diagnostic, answers):
    """Ne conserve que les réponses valides (questions connues, valeurs autorisées, longueur bornée)."""
    out = {}
    for q in diagnostic["questions"]:
        v = answers.get(q["id"])
        if v in (None, "", []):
            continue
        if q["type"] == "text":
            out[q["id"]] = str(v)[:1000]
            continue
        allowed = {o["value"] for o in q.get("options", [])}
        if q["type"] == "multi":
            vals = [str(x) for x in (v if isinstance(v, list) else [v]) if str(x) in allowed]
            if vals:
                out[q["id"]] = vals
        elif str(v) in allowed:
            out[q["id"]] = str(v)
    return out


# ------------------------------------------------------------ Passeport Beauté
DEFAULT_MILESTONES = [
    {"at": 3, "label": "Mini attention", "msg": "Merci pour votre fidélité !"},
    {"at": 6, "label": "Belle attention", "msg": "Vous êtes sur la bonne voie !"},
    {"at": 9, "label": "Très belle attention", "msg": "Presque la récompense !"},
]


def passport(conn, client_id):
    """Éclats de la cliente : 1 prestation réalisée = 1 éclat ; une surprise à chaque cycle complet."""
    cfg = setting(conn, "loyalty", {})
    target = max(1, int(cfg.get("stamps_target", 10)))
    u = row(conn, "SELECT stamps_bonus, rewards_given, created_at FROM users WHERE id=?", (client_id,))
    visits = rows(conn, "SELECT a.id, a.start, sv.name AS service, sv.category FROM appointments a "
                        "JOIN services sv ON sv.id=a.service_id WHERE a.client_id=? AND a.status='termine' ORDER BY a.start DESC", (client_id,))
    total = len(visits) + u["stamps_bonus"]
    pending = max(0, total // target - u["rewards_given"])
    current = min(target, max(0, total - u["rewards_given"] * target))
    milestones = [{**m, "reached": current >= m["at"]} for m in (cfg.get("milestones") or DEFAULT_MILESTONES) if 0 < m.get("at", 0) < target]
    milestones.append({"at": target, "label": cfg.get("reward_name", "Surprise"), "msg": "Votre papillon est complet !", "reached": current >= target, "final": True})
    return {"target": target, "current": current, "total": total, "bonus": u["stamps_bonus"], "pending_rewards": pending,
            "rewards_given": u["rewards_given"], "reward_name": cfg.get("reward_name", "Surprise"), "milestones": milestones,
            "history": visits[:30], "since": u["created_at"][:10]}
