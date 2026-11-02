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
