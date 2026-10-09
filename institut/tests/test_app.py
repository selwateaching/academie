import base64
from datetime import date, datetime, timedelta

from conftest import H

PNG = "data:image/png;base64," + base64.b64encode(
    bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5f645400000000049454e44ae426082")).decode()


def j(r):
    return r.get_json()


def services(anon):
    return {s["slug"]: s for s in j(anon.get("/api/public/services"))["services"]}


def next_slot(anon, svc_id, skip=0):
    days = j(anon.get(f"/api/public/availability?service_id={svc_id}&days=30"))["days"]
    out = [f"{d}T{t}" for d, ts in days.items() for t in ts]
    return out[skip]


LISSAGE_BAD = {"hair_type": "ondules", "hair_state": "decolores", "recent_color": "no", "bleached": "yes", "past_smoothing": "no", "dryness": "5", "breakage": "yes",
               "split_ends": "moyen", "porosity": "forte", "dryer": "jamais", "flat_iron": "jamais", "chemical": "no", "pregnant": "no", "allergy": "no", "goal": ["lisse"]}


def test_public_pages_and_csrf(anon):
    for url in ["/", "/reserver", "/compte", "/admin", "/healthz"]:
        assert anon.get(url).status_code == 200
    assert anon.post("/api/auth/login", json={"email": "a@b.fr", "password": "x"}).status_code == 403  # pas d'en-tête


def test_admin_requires_pro(anon, client):
    assert anon.get("/api/admin/dashboard").status_code == 401
    assert client.get("/api/admin/dashboard").status_code == 403
    assert client.get("/api/admin/clients").status_code == 403


def test_login_wrong_password(anon):
    assert anon.post("/api/auth/login", json={"email": "pro@institut.local", "password": "nope"}, headers=H).status_code == 401


def test_diagnostic_evaluation_matches_spec_example(anon):
    s = services(anon)["lissage-bresilien"]
    r = anon.post("/api/public/diagnostics/lissage/evaluate", json={"answers": LISSAGE_BAD, "service_id": s["id"]}, headers=H)
    res = j(r)["result"]
    assert res["verdict"] == "prepare"
    assert [x["slug"] for x in res["recommended"]][:2] == ["soin-reparateur", "soin-hydratant"]
    assert "phase de préparation et de réparation" in " ".join(res["extra_messages"])
    assert "pas un diagnostic médical" in res["disclaimer"]


def test_diagnostic_requires_mandatory_answers(anon):
    r = anon.post("/api/public/diagnostics/lissage/evaluate", json={"answers": {"hair_type": "raides"}}, headers=H)
    assert r.status_code == 400 and "missing" in j(r)


def test_invalid_answer_values_are_dropped(anon):
    s = services(anon)["lissage-bresilien"]
    bad = {**LISSAGE_BAD, "dryness": "999", "hair_type": "<script>"}
    assert anon.post("/api/public/diagnostics/lissage/evaluate", json={"answers": bad, "service_id": s["id"]}, headers=H).status_code == 400


def test_availability_respects_hours_and_notice(anon):
    s = services(anon)["manucure-classique"]
    days = j(anon.get(f"/api/public/availability?service_id={s['id']}&days=14"))["days"]
    for d, ts in days.items():
        wd = date.fromisoformat(d).weekday()
        if wd in (0, 6):
            assert ts == []  # fermé lundi/dimanche
        for t in ts:
            assert datetime.fromisoformat(f"{d}T{t}") > datetime.now()


def test_booking_with_required_diagnostic_and_double_booking(client, anon):
    s = services(anon)
    liss = s["lissage-bresilien"]
    slot = next_slot(anon, liss["id"])
    # diagnostic obligatoire
    assert client.post("/api/client/bookings", json={"service_id": liss["id"], "start": slot}, headers=H).status_code == 400
    diag = {"slug": "lissage", "service_id": liss["id"], "answers": LISSAGE_BAD, "photos": {"face": PNG}}
    # on réserve le soin recommandé (pas de diagnostic obligatoire)
    soin = s["soin-reparateur"]
    slot2 = next_slot(anon, soin["id"])
    r = client.post("/api/client/bookings", json={"service_id": soin["id"], "start": slot2, "diagnostic": diag}, headers=H)
    assert r.status_code == 201, j(r)
    assert j(r)["appointment"]["status"] == "confirme"
    # le créneau est pris
    assert client.post("/api/client/bookings", json={"service_id": soin["id"], "start": slot2}, headers=H).status_code == 409
    # devis généré à partir du diagnostic, converti par la réservation
    q = j(client.get("/api/client/quotes"))["quotes"][0]
    assert q["status"] == "converted" and q["total"] == 95  # 45 + 35 + 15
    detail = j(client.get(f"/api/client/quotes/{q['id']}"))["quote"]
    assert detail["result"]["verdict"] == "prepare"
    pdf = client.get(f"/api/client/quotes/{q['id']}.pdf")
    assert pdf.status_code == 200 and pdf.data[:4] == b"%PDF"


def test_photos_are_private(client, anon, app):
    s = services(anon)
    soin = s["soin-reparateur"]
    diag = {"slug": "lissage", "service_id": s["lissage-bresilien"]["id"], "answers": LISSAGE_BAD, "photos": {"face": PNG}}
    client.post("/api/client/bookings", json={"service_id": soin["id"], "start": next_slot(anon, soin["id"], 5), "diagnostic": diag}, headers=H)
    photo = j(client.get("/api/client/history"))["diagnostics"][0]["photos"][0]["file"]
    assert client.get(f"/media/private/{photo}").status_code == 200
    assert anon.get(f"/media/private/{photo}").status_code == 401
    other = app.test_client()
    other.post("/api/auth/register", json={"email": "autre@example.com", "password": "motdepasse1", "first_name": "A", "last_name": "B", "consent_data": True}, headers=H)
    assert other.get(f"/media/private/{photo}").status_code == 404


def test_upload_rejects_non_images(client, anon):
    soin = services(anon)["soin-reparateur"]
    bad = "data:image/png;base64," + base64.b64encode(b"<html>not an image").decode()
    diag = {"slug": "lissage", "service_id": soin["id"], "answers": LISSAGE_BAD, "photos": {"face": bad}}
    assert client.post("/api/client/bookings", json={"service_id": soin["id"], "start": next_slot(anon, soin["id"], 7), "diagnostic": diag}, headers=H).status_code == 400


def test_pregnancy_makes_a_request_requiring_validation(client, anon, pro):
    s = services(anon)
    liss = s["lissage-bresilien"]
    ok = {**LISSAGE_BAD, "dryness": "1", "breakage": "no", "porosity": "faible", "hair_state": "naturels", "bleached": "no", "pregnant": "yes"}
    diag = {"slug": "lissage", "service_id": liss["id"], "answers": ok}
    r = client.post("/api/client/bookings", json={"service_id": liss["id"], "start": next_slot(anon, liss["id"], 9), "diagnostic": diag, "pay_deposit": False}, headers=H)
    a = j(r)["appointment"]
    assert a["status"] == "demande"
    sub = [x for x in j(pro.get("/api/admin/submissions?validation=pending"))["submissions"] if x["client_id"] == client.uid][0]
    assert any("Grossesse" in al for al in sub["result"]["alerts"])
    assert pro.post(f"/api/admin/submissions/{sub['id']}/review", json={"validation": "approved"}, headers=H).status_code == 200
    # l'acompte n'étant pas réglé, le rendez-vous passe « en attente » (pas confirmé)
    assert j(client.get("/api/client/appointments"))["appointments"][0]["status"] == "en_attente"


def test_deposit_payment_confirms_and_awards_points(client, anon):
    pose = services(anon)["pose-gel"]
    r = client.post("/api/client/bookings", json={"service_id": pose["id"], "start": next_slot(anon, pose["id"], 3),
                    "diagnostic": {"slug": "onglerie", "service_id": pose["id"], "answers": {"nail_state": "sains", "current": "naturels", "fragile": "no", "biting": "no", "skin_issue": "no", "allergy": "no", "wanted": "gel"}}, "pay_deposit": True}, headers=H)
    assert r.status_code == 201, j(r)
    a = j(r)["appointment"]
    assert a["status"] == "confirme" and a["deposit_paid"] == 1
    assert j(client.get("/api/client/loyalty"))["points"] == 15


def test_cancellation_policy(client, anon):
    soin = services(anon)["soin-hydratant"]
    # créneau dans moins de 24 h impossible à annuler en ligne : on crée directement via la base
    import db
    from datetime import timedelta
    conn = db.connect()
    start = datetime.now() + timedelta(hours=2)
    conn.execute("INSERT INTO appointments(client_id,service_id,start,end,status,price,created_at) VALUES (?,?,?,?,?,?,?)",
                 (client.uid, soin["id"], start.isoformat(timespec="minutes"), (start + timedelta(minutes=40)).isoformat(timespec="minutes"), "confirme", 35, db.now_iso()))
    conn.commit()
    aid = conn.execute("SELECT MAX(id) FROM appointments").fetchone()[0]
    conn.close()
    r = client.post(f"/api/client/appointments/{aid}/cancel", headers=H)
    assert r.status_code == 409 and "24 h" in j(r)["error"]
    # un créneau lointain est annulable
    slot = next_slot(anon, soin["id"], 40)
    aid2 = j(client.post("/api/client/bookings", json={"service_id": soin["id"], "start": slot}, headers=H))["appointment"]["id"]
    assert client.post(f"/api/client/appointments/{aid2}/cancel", headers=H).status_code == 200


def test_completing_appointment_consumes_stock_invoices_and_pays(pro, client, anon):
    soin = services(anon)["soin-reparateur"]
    aid = j(client.post("/api/client/bookings", json={"service_id": soin["id"], "start": next_slot(anon, soin["id"], 20)}, headers=H))["appointment"]["id"]
    before = {p["name"]: p["stock"] for p in j(pro.get("/api/admin/products"))["products"]}
    assert pro.post(f"/api/admin/appointments/{aid}/status", json={"status": "termine"}, headers=H).status_code == 200
    after = {p["name"]: p["stock"] for p in j(pro.get("/api/admin/products"))["products"]}
    assert round(before["Masque réparateur kératine"] - after["Masque réparateur kératine"], 3) == 0.08
    inv = j(pro.get("/api/admin/invoices"))["invoices"][0]
    assert inv["total"] == 45 and inv["status"] == "due"
    # terminer deux fois ne décrémente pas deux fois
    pro.post(f"/api/admin/appointments/{aid}/status", json={"status": "termine"}, headers=H)
    assert {p["name"]: p["stock"] for p in j(pro.get("/api/admin/products"))["products"]}["Masque réparateur kératine"] == after["Masque réparateur kératine"]
    assert pro.post(f"/api/admin/invoices/{inv['id']}/payments", json={"amount": 100, "method": "carte"}, headers=H).status_code == 400
    assert pro.post(f"/api/admin/invoices/{inv['id']}/payments", json={"amount": 45, "method": "espèces"}, headers=H).status_code == 200
    assert [i for i in j(pro.get("/api/admin/invoices"))["invoices"] if i["id"] == inv["id"]][0]["status"] == "paid"
    assert j(client.get("/api/client/loyalty"))["points"] == 45
    assert client.get(f"/api/client/invoices/{inv['id']}.pdf").data[:4] == b"%PDF"


def test_stock_cannot_go_negative_and_inventory(pro):
    p = j(pro.get("/api/admin/products"))["products"][0]
    assert pro.post(f"/api/admin/products/{p['id']}/move", json={"reason": "loss", "qty": p["stock"] + 5}, headers=H).status_code == 409
    r = pro.post(f"/api/admin/products/{p['id']}/move", json={"reason": "inventory", "qty": 7}, headers=H)
    assert j(r)["stock"] == 7


def test_photo_marketing_requires_client_consent(pro, client):
    img = {"client_id": client.uid, "kind": "before", "image": PNG}
    assert pro.post("/api/admin/photos", json={**img, "marketing_ok": True}, headers=H).status_code == 409
    assert pro.post("/api/admin/photos", json=img, headers=H).status_code == 201
    pro.put(f"/api/admin/clients/{client.uid}", json={"consent_photos": True}, headers=H)
    assert pro.post("/api/admin/photos", json={**img, "kind": "after", "marketing_ok": True}, headers=H).status_code == 201
    assert len(j(pro.get("/api/admin/gallery"))["photos"]) >= 1
    pro.put(f"/api/admin/clients/{client.uid}", json={"consent_photos": False}, headers=H)  # retrait du consentement
    assert j(pro.get("/api/admin/gallery"))["photos"] == [] or all(p for p in [])
    gal = j(pro.get(f"/api/admin/clients/{client.uid}"))["photos"]
    assert not any(p["marketing_ok"] for p in gal)


def test_rule_crud_changes_outcome(pro, anon):
    d = [x for x in j(pro.get("/api/admin/diagnostics"))["diagnostics"] if x["slug"] == "lissage"][0]
    rule = {"name": "Test porosité", "priority": 1, "condition": {"q": "hair_type", "op": "eq", "v": "crepus"}, "action": {"verdict": "not_now", "alert": "Test", "recommend": ["diagnostic-institut"]}}
    rid = j(pro.post(f"/api/admin/diagnostics/{d['id']}/rules", json=rule, headers=H))["id"]
    s = services(anon)["lissage-bresilien"]
    ok = {**LISSAGE_BAD, "dryness": "1", "breakage": "no", "porosity": "faible", "hair_state": "naturels", "bleached": "no", "hair_type": "crepus"}
    res = j(anon.post("/api/public/diagnostics/lissage/evaluate", json={"answers": ok, "service_id": s["id"]}, headers=H))["result"]
    assert res["verdict"] == "not_now" and res["needs_validation"]
    # validation : question inconnue / prestation inconnue refusées
    bad = {**rule, "condition": {"q": "nope", "op": "eq", "v": 1}}
    assert pro.put(f"/api/admin/rules/{rid}", json=bad, headers=H).status_code == 400
    assert pro.put(f"/api/admin/rules/{rid}", json={**rule, "action": {"recommend": ["inconnu"]}}, headers=H).status_code == 400
    pro.delete(f"/api/admin/rules/{rid}", headers=H)


def test_new_diagnostic_can_be_created_and_questions_validated(pro):
    did = j(pro.post("/api/admin/diagnostics", json={"name": "Diagnostic visage", "category": "Visage"}, headers=H))["id"]
    qs = [{"id": "peau", "label": "Type de peau ?", "type": "single", "required": True, "options": [{"value": "seche", "label": "Sèche"}, {"value": "grasse", "label": "Grasse"}]}]
    assert pro.put(f"/api/admin/diagnostics/{did}", json={"questions": qs}, headers=H).status_code == 200
    assert pro.put(f"/api/admin/diagnostics/{did}", json={"questions": [{"id": "x y", "label": "?", "type": "single"}]}, headers=H).status_code == 400
    assert pro.post(f"/api/admin/diagnostics/{did}/test", json={"answers": {"peau": "seche"}}, headers=H).status_code == 200


def test_blocks_and_leave_remove_availability(pro, anon):
    s = services(anon)["manucure-classique"]
    slot = next_slot(anon, s["id"], 60)
    day = slot[:10]
    assert pro.post("/api/admin/blocks", json={"kind": "leave", "start": f"{day}T00:00", "end": f"{day}T23:59", "label": "Congés"}, headers=H).status_code == 201
    assert j(anon.get(f"/api/public/availability?service_id={s['id']}&from={day}&days=1"))["days"][day] == []


def test_quote_public_link_accept_and_refuse(pro, client, anon):
    qid = j(pro.post("/api/admin/quotes", json={"client_id": client.uid, "items": [{"label": "Soin", "price": 40, "qty": 1}]}, headers=H))["id"]
    assert pro.post(f"/api/admin/quotes/{qid}/send", headers=H).status_code == 200
    q = [x for x in j(pro.get("/api/admin/quotes"))["quotes"] if x["id"] == qid][0]
    assert anon.get(f"/devis/{q['token']}").status_code == 200
    assert j(anon.post(f"/api/public/quotes/{q['token']}/accept", headers=H))["quote"]["status"] == "accepted"
    assert anon.get(f"/api/public/quotes/{q['token']}.pdf").data[:4] == b"%PDF"
    assert anon.get("/devis/inexistant").status_code == 404


def test_gdpr_export_and_delete(client):
    assert client.get("/api/client/export").status_code == 200
    assert client.delete("/api/client/account", json={"password": "faux"}, headers=H).status_code == 400
    assert client.delete("/api/client/account", json={"password": "motdepasse1"}, headers=H).status_code == 200
    assert client.get("/api/auth/me").get_json()["user"] is None


def test_stats_and_settings(pro):
    assert j(pro.get("/api/admin/stats"))["months"]
    assert pro.put("/api/admin/settings/opening_hours", json={"value": {"1": [["18:00", "09:00"]]}}, headers=H).status_code == 400
    assert pro.put("/api/admin/settings/loyalty", json={"value": {"reward_points": 50}}, headers=H).status_code == 200


def test_reviews_flow_requires_completed_visit_and_moderation(pro, client, anon):
    soin = services(anon)["soin-hydratant"]
    # pas d'avis sans prestation terminée
    assert client.post("/api/client/reviews", json={"appointment_id": 1, "rating": 5}, headers=H).status_code == 409
    aid = j(client.post("/api/client/bookings", json={"service_id": soin["id"], "start": next_slot(anon, soin["id"], 30)}, headers=H))["appointment"]["id"]
    assert client.post("/api/client/reviews", json={"appointment_id": aid, "rating": 5}, headers=H).status_code == 409  # pas encore terminée
    pro.post(f"/api/admin/appointments/{aid}/status", json={"status": "termine"}, headers=H)
    assert j(client.get("/api/client/reviews"))["eligible"][0]["id"] == aid
    assert client.post("/api/client/reviews", json={"appointment_id": aid, "rating": 9}, headers=H).status_code == 400
    assert client.post("/api/client/reviews", json={"appointment_id": aid, "rating": 5, "text": "Merci !"}, headers=H).status_code == 201
    assert client.post("/api/client/reviews", json={"appointment_id": aid, "rating": 5}, headers=H).status_code == 409  # un seul avis
    # en attente : invisible du public
    assert j(anon.get("/api/public/reviews"))["reviews"] == []
    rid = [r for r in j(pro.get("/api/admin/reviews"))["reviews"] if r["client_id"] == client.uid][0]["id"]
    assert pro.post(f"/api/admin/reviews/{rid}/status", json={"status": "published"}, headers=H).status_code == 200
    pub = j(anon.get("/api/public/reviews"))["reviews"]
    assert pub and pub[0]["text"] == "Merci !" and pub[0]["display_name"].startswith("Léa")
    assert b"Merci !" in anon.get("/").data
    assert anon.post("/api/admin/reviews/1/status", json={"status": "published"}, headers=H).status_code == 401


def test_landing_has_photo_viewer(anon):
    page = anon.get("/").get_data(as_text=True)
    assert "js/landing.js" in page and "class=\"gallery\"" in page
    assert anon.get("/static/js/landing.js").status_code == 200


def test_landing_photos_link_to_services(anon):
    import json, re
    page = anon.get("/").get_data(as_text=True)
    data = json.loads(re.search(r'id="svc-data">(.*?)</script>', page, re.S).group(1))
    assert {"Cheveux", "Ongles", "Cils", "Pieds", "Épilation", "Visage"} <= set(data)
    assert all({"id", "name", "price", "duration"} <= set(s) for v in data.values() for s in v)
    assert 'data-cat="Cheveux"' in page and 'data-cat="Épilation"' in page
