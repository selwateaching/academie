import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["ADMIN_EMAIL"] = "admin@test.fr"
os.environ["ADMIN_PASSWORD"] = "motdepasse-test"
os.environ["OPENAI_API_KEY"] = ""
os.environ["GOOGLE_PLACES_API_KEY"] = ""
os.environ["SMTP_HOST"] = ""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def auth(client, email="admin@test.fr", pw="motdepasse-test"):
    r = client.post("/api/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["token"]}


def test_login_required(client):
    assert client.get("/api/companies").status_code == 401
    assert client.post("/api/auth/login", json={"email": "admin@test.fr", "password": "x"}).status_code == 401


def test_roles(client):
    h = auth(client)
    r = client.post("/api/users", headers=h, json={"email": "com@test.fr", "role": "commercial", "password": "commercial-1"})
    assert r.status_code == 201
    hc = auth(client, "com@test.fr", "commercial-1")
    assert client.get("/api/users", headers=hc).status_code == 403
    assert client.post("/api/agent/search", headers=hc, json={"category": "flotte", "city": "Toulouse"}).status_code == 403


def test_csv_import_scoring_and_dedup(client):
    h = auth(client)
    csv_data = "name;category;city;phone;email\nLoc Auto 31;location;Toulouse;0561000000;contact@locauto.fr\nTransports Dupont;transport;Toulouse;;\n"
    r = client.post("/api/agent/import-csv", headers=h, files={"file": ("p.csv", csv_data, "text/csv")})
    assert r.json()["added"] == 2
    rows = client.get("/api/companies", headers=h).json()
    assert all(c["score"] is not None for c in rows)
    assert rows[0]["score"] >= rows[-1]["score"]


def test_places_without_key_is_clear_error(client):
    r = client.post("/api/agent/search", headers=auth(client), json={"category": "flotte", "city": "Toulouse"})
    assert r.status_code == 400 and "GOOGLE_PLACES_API_KEY" in r.json()["detail"]


def test_human_validation_flow(client):
    h = auth(client)
    cid = client.get("/api/companies", headers=h).json()[0]["id"]
    m = client.post(f"/api/companies/{cid}/draft", headers=h, json={"kind": "email"}).json()
    assert m["status"] == "brouillon" and "STOP" in m["body"]
    # envoi impossible sans validation
    assert client.post(f"/api/messages/{m['id']}/send", headers=h).status_code == 409
    assert client.post(f"/api/messages/{m['id']}/approve", headers=h).json()["status"] == "valide"
    # modifier annule la validation
    assert client.patch(f"/api/messages/{m['id']}", headers=h, json={"body": "x"}).json()["status"] == "brouillon"
    client.post(f"/api/messages/{m['id']}/approve", headers=h)
    # SMTP absent : refus explicite, pas d'envoi silencieux
    assert client.post(f"/api/messages/{m['id']}/send", headers=h).status_code in (400, 422)
    assert client.post(f"/api/messages/{m['id']}/mark-sent", headers=h).json()["status"] == "envoye"


def test_opt_out_blocks_contact(client):
    h = auth(client)
    cid = client.get("/api/companies", headers=h).json()[0]["id"]
    client.patch(f"/api/companies/{cid}", headers=h, json={"do_not_contact": True})
    assert client.post(f"/api/companies/{cid}/draft", headers=h, json={"kind": "email"}).status_code == 409


def test_stats_and_index(client):
    assert client.get("/api/stats", headers=auth(client)).json()["companies"] == 2
    assert client.get("/").status_code == 200


def test_dotenv_is_loaded(tmp_path, monkeypatch):
    from app import config
    env = config.Path(config.__file__).resolve().parent.parent / ".env"
    assert not env.exists()
    env.write_text("# c\nZZ_TEST_VAR=\"valeur\"\n", encoding="utf-8")
    try:
        monkeypatch.delenv("ZZ_TEST_VAR", raising=False)
        config._load_dotenv()
        assert os.environ["ZZ_TEST_VAR"] == "valeur"
    finally:
        env.unlink()
        os.environ.pop("ZZ_TEST_VAR", None)


# ---------- Gérant (registre public, simulé) ----------
FAKE = [
    {"nom_complet": "GARAGE DU MIDI SARL", "siren": "123456789", "siege": {"libelle_commune": "TOULOUSE"},
     "dirigeants": [
         {"type_dirigeant": "personne morale", "denomination": "HOLDING X"},
         {"type_dirigeant": "personne physique", "nom": "DURAND", "prenoms": "Marie, Claire", "qualite": "Associé"},
         {"type_dirigeant": "personne physique", "nom": "MARTIN", "prenoms": "Paul", "qualite": "Gérant"},
     ]},
]


def test_pick_manager_prefers_gerant_and_formats_name():
    from app.agent import enrichment
    r = enrichment.pick_manager(FAKE, "Garage du Midi", "Toulouse")
    assert r["contact_name"] == "Paul Martin" and r["siren"] == "123456789"


def test_pick_manager_refuses_wrong_company_or_city():
    from app.agent import enrichment
    assert enrichment.pick_manager(FAKE, "Carrosserie Lopez", "Toulouse") is None
    assert enrichment.pick_manager(FAKE, "Garage du Midi", "Lyon") is None


def test_find_manager_endpoint_and_greeting(client, monkeypatch):
    from app.agent import enrichment
    monkeypatch.setattr(enrichment, "find_manager", lambda name, city, address="": enrichment.pick_manager(FAKE, name, city, address))
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Garage du Midi", "category": "garage", "city": "Toulouse"}).json()
    r = client.post(f"/api/companies/{c['id']}/find-manager", headers=h).json()
    assert r["found"] is True and r["contact_name"] == "Paul Martin" and "à vérifier" in r["notes"]
    # le brouillon s'adresse au gérant
    m = client.post(f"/api/companies/{c['id']}/draft", headers=h, json={"kind": "email"}).json()
    assert "Paul Martin" in m["body"]


def test_manual_contact_name_never_overwritten(client, monkeypatch):
    from app.agent import enrichment
    monkeypatch.setattr(enrichment, "find_manager", lambda n, c, a="": {"contact_name": "Autre", "qualite": "", "siren": "1"})
    h = auth(client)
    c = next(x for x in client.get("/api/companies", headers=h).json() if x["name"] == "Loc Auto 31")
    client.patch(f"/api/companies/{c['id']}", headers=h, json={"contact_name": "Sophie Bernard"})
    r = client.post(f"/api/companies/{c['id']}/find-manager", headers=h).json()
    assert r["found"] is False and r["contact_name"] == "Sophie Bernard"


def test_city_typed_as_department_still_matches_via_address():
    from app.agent import enrichment
    fake = [{"nom_complet": "UCAR TOULOUSE SAS", "siren": "9", "siege": {"libelle_commune": "TOULOUSE", "code_postal": "31200"},
             "dirigeants": [{"type_dirigeant": "personne physique", "nom": "LEROY", "prenoms": "Anne", "qualite": "Présidente"}]}]
    addr = "5 Rue des Fleurs, 31200 Toulouse, France"
    assert enrichment.commune_from_address(addr) == "Toulouse"
    assert enrichment.pick_manager(fake, "Ucar - Location de voitures Toulouse", "31", addr)["contact_name"] == "Anne Leroy"
    assert enrichment.pick_manager(fake, "Ucar - Location de voitures Toulouse", "31", "1 rue A, 69000 Lyon, France") is None


# ---------- Relances et rapport ----------
def _age_company(cid, days):
    from datetime import datetime, timedelta, timezone
    from app import models
    from app.db import SessionLocal
    with SessionLocal() as db:
        db.get(models.Company, cid).last_contact = datetime.now(timezone.utc) - timedelta(days=days)
        db.commit()


def test_relances_flow(client):
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Relance SARL", "category": "flotte", "city": "Toulouse", "phone": "0561"}).json()
    client.patch(f"/api/companies/{c['id']}", headers=h, json={"status": "contacte"})
    ids = lambda: [x["id"] for x in client.get("/api/relances", headers=h).json()["items"]]
    assert c["id"] not in ids()                      # contacté à l'instant : trop tôt
    _age_company(c["id"], 6)
    assert c["id"] in ids()                          # 6 jours > 5 jours
    r = client.post("/api/relances/draft-all", headers=h).json()
    assert r["created"] >= 1
    assert c["id"] not in ids()                      # brouillon en attente : pas de doublon
    assert client.post("/api/relances/draft-all", headers=h).json()["created"] == 0
    msgs = [m for m in client.get("/api/messages", headers=h).json() if m["company_id"] == c["id"] and m["kind"] == "relance"]
    assert len(msgs) == 1 and msgs[0]["status"] == "brouillon"
    # jamais d'envoi sans validation
    assert client.post(f"/api/messages/{msgs[0]['id']}/send", headers=h).status_code == 409


def test_relance_skips_opt_out_and_caps_at_two(client):
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Opposé SA", "category": "taxi", "city": "Toulouse"}).json()
    client.patch(f"/api/companies/{c['id']}", headers=h, json={"status": "contacte", "do_not_contact": True})
    _age_company(c["id"], 30)
    assert c["id"] not in [x["id"] for x in client.get("/api/relances", headers=h).json()["items"]]


def test_report_and_dashboard(client):
    h = auth(client)
    r = client.get("/api/report?days=7", headers=h).json()
    for key in ("new_prospects", "messages_sent", "to_relance", "by_status", "top_to_contact", "garage"):
        assert key in r
    assert r["new_prospects"] >= 1 and len(r["top_to_contact"]) <= 5
    assert "to_relance" in client.get("/api/stats", headers=h).json()


def test_first_email_uses_garage_template_verbatim(client):
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Modèle Auto", "category": "concession", "city": "Toulouse",
                                                       "contact_name": "Julie Roux"}).json()
    m = client.post(f"/api/companies/{c['id']}/draft", headers=h, json={"kind": "email"}).json()
    assert m["subject"].startswith("Proposition de partenariat carrosserie et peinture")
    assert m["body"].startswith("Bonjour Julie Roux,")
    assert "Nous avons identifié votre établissement" in m["body"]
    assert "05 32 00 22 13 / 06 52 92 24 04" in m["body"]
    assert m["body"].count("STOP") == 1            # pas de mention en double
    # sans gérant connu : formule neutre
    c2 = client.post("/api/companies", headers=h, json={"name": "Sans Nom", "category": "vo", "city": "Toulouse"}).json()
    m2 = client.post(f"/api/companies/{c2['id']}/draft", headers=h, json={"kind": "email"}).json()
    assert m2["body"].startswith("Bonjour,\n")
    # la relance, elle, n'utilise pas ce modèle
    r = client.post(f"/api/companies/{c2['id']}/draft", headers=h, json={"kind": "relance"}).json()
    assert "Nous avons identifié votre établissement" not in r["body"]


def test_call_script_uses_garage_template(client):
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Appel SARL", "category": "vo", "city": "Toulouse",
                                                       "phone": "0561999999", "contact_name": "Karim Haddad"}).json()
    m = client.post(f"/api/companies/{c['id']}/draft", headers=h, json={"kind": "script_appel"}).json()
    assert m["subject"] == "Script d'appel – Appel SARL"
    assert "À appeler : Appel SARL – 0561999999" in m["body"] and "Interlocuteur : Karim Haddad" in m["body"]
    assert "1. Accroche et présentation" in m["body"] and "5. Conclusion" in m["body"]
    assert "STOP" not in m["body"] and "Cordialement" not in m["body"]      # pas de signature ni mention email
    c2 = client.post("/api/companies", headers=h, json={"name": "Anonyme", "category": "vo", "city": "Toulouse"}).json()
    m2 = client.post(f"/api/companies/{c2['id']}/draft", headers=h, json={"kind": "script_appel"}).json()
    assert "demander le responsable" in m2["body"]


# ---------- Sécurité et administration ----------
def test_login_lockout_after_5_failures(client):
    for _ in range(5):
        assert client.post("/api/auth/login", json={"email": "lock@test.fr", "password": "x"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "lock@test.fr", "password": "x"}).status_code == 429
    # un autre compte n'est pas bloqué
    assert client.post("/api/auth/login", json={"email": "admin@test.fr", "password": "motdepasse-test"}).status_code == 200


def test_user_admin_rules(client):
    h = auth(client)
    me = client.get("/api/users", headers=h).json()
    admin = next(u for u in me if u["email"] == "admin@test.fr")
    assert client.patch(f"/api/users/{admin['id']}", headers=h, json={"active": False}).status_code == 409
    assert client.patch(f"/api/users/{admin['id']}", headers=h, json={"role": "commercial"}).status_code == 409
    com = next(u for u in me if u["email"] == "com@test.fr")
    assert client.patch(f"/api/users/{com['id']}", headers=h, json={"password": "court"}).status_code == 422
    assert client.patch(f"/api/users/{com['id']}", headers=h, json={"password": "nouveau-mdp-1", "role": "manager"}).json()["role"] == "manager"
    auth(client, "com@test.fr", "nouveau-mdp-1")                       # le nouveau mot de passe fonctionne
    assert client.patch(f"/api/users/{com['id']}", headers=h, json={"active": False}).json()["active"] is False
    assert client.post("/api/auth/login", json={"email": "com@test.fr", "password": "nouveau-mdp-1"}).status_code == 401
    # un commercial ne peut pas administrer
    client.patch(f"/api/users/{com['id']}", headers=h, json={"active": True, "role": "commercial"})
    hc = auth(client, "com@test.fr", "nouveau-mdp-1")
    assert client.patch(f"/api/users/{admin['id']}", headers=hc, json={"name": "x"}).status_code == 403
    assert client.get("/api/export/companies.csv", headers=hc).status_code == 403


def test_export_csv(client):
    r = client.get("/api/export/companies.csv", headers=auth(client))
    assert r.status_code == 200 and "attachment" in r.headers["content-disposition"]
    first = r.content.decode("utf-8-sig").splitlines()[0]
    assert first.startswith("name;category;city") and "Modèle Auto" in r.content.decode("utf-8-sig")


def test_production_refuses_default_secrets(monkeypatch):
    import app.main as m
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("SECRET_KEY", "change-me-long-random-string")
    with pytest.raises(RuntimeError):
        m.startup()
