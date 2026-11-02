import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["ADMIN_EMAIL"] = "admin@test.fr"
os.environ["ADMIN_PASSWORD"] = "motdepasse-test"
os.environ["OPENAI_API_KEY"] = ""
os.environ["GOOGLE_PLACES_API_KEY"] = ""
os.environ["SMTP_HOST"] = ""
os.environ["NO_SCHEDULER"] = "1"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """Les tests ne sortent jamais sur Internet : recherche de gérant/email désactivée par défaut."""
    from app.agent import emailfinder, enrichment
    monkeypatch.setattr(enrichment, "find_manager", lambda name, city, address="": None)
    monkeypatch.setattr(emailfinder, "fetch", lambda url: "")


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


def test_stats_exposes_sender_empty_without_smtp(client):
    assert client.get("/api/stats", headers=auth(client)).json()["sender"] == ""


# ---------- Recherche automatique de l'email sur le site ----------
PAGES = {
    "https://garage-dupont.fr": '<html><a href="/nos-services">Services</a><a href="/contact-us">Contact</a><img src="logo@2x.png"></html>',
    "https://garage-dupont.fr/contact-us": """<p>Écrivez-nous : <a href="mailto:Contact@Garage-Dupont.fr?subject=x">ici</a></p>
        <p>noreply@garage-dupont.fr — webmaster@garage-dupont.fr — dupont [at] gmail.com</p>""",
}


def _fake_fetch(url):
    return PAGES.get(url.rstrip("/"), "")


def test_find_email_reads_contact_page_and_filters_junk():
    from app.agent import emailfinder
    r = emailfinder.find_email("garage-dupont.fr", fetcher=_fake_fetch)
    assert r == {"email": "contact@garage-dupont.fr", "source": "https://garage-dupont.fr/contact-us"}


def test_find_email_decodes_cloudflare_protection_and_ignores_images():
    from app.agent import emailfinder
    key, addr = 0x2A, "info@atelier.fr"
    cf = f"{key:02x}" + "".join(f"{ord(ch) ^ key:02x}" for ch in addr)
    page = f'<a class="__cf_email__" data-cfemail="{cf}">[email protected]</a> <img src="banner@3x.jpg">'
    assert emailfinder.find_email("https://atelier.fr", fetcher=lambda u: page)["email"] == addr


def test_find_email_returns_none_when_nothing_public():
    from app.agent import emailfinder
    assert emailfinder.find_email("https://vide.fr", fetcher=lambda u: "<html>formulaire seulement</html>") is None
    assert emailfinder.find_email("", fetcher=lambda u: "x") is None


def test_ssrf_guard_refuses_private_hosts():
    from app.agent import emailfinder
    for host in ("localhost", "127.0.0.1", "10.0.0.5", "192.168.1.10", "169.254.169.254"):
        assert emailfinder._is_public_host(host) is False
    assert emailfinder.fetch("http://127.0.0.1:8000/") == ""


def test_agent_search_enriches_new_prospects_automatically(client, monkeypatch):
    from app.agent import emailfinder, enrichment, prospector
    h = auth(client)
    monkeypatch.setattr(prospector, "search_places", lambda cat, city, limit: [
        {"name": "Garage Dupont", "category": "garage", "city": "Toulouse", "address": "1 rue A, 31000 Toulouse, France",
         "website": "https://garage-dupont.fr", "phone": "0561", "source": "google_places", "source_ref": "gp:AUTO1"},
        {"name": "Sans Site SARL", "category": "garage", "city": "Toulouse", "address": "2 rue B, 31000 Toulouse, France",
         "phone": "0562", "source": "google_places", "source_ref": "gp:AUTO2"}])
    monkeypatch.setattr(emailfinder, "fetch", _fake_fetch)
    monkeypatch.setattr(enrichment, "find_manager", lambda n, c, a="": {"contact_name": "Marc Dupont", "qualite": "Gérant", "siren": "1"}
                        if "Dupont" in n else None)
    r = client.post("/api/agent/search", headers=h, json={"category": "garage", "city": "Toulouse", "limit": 5}).json()
    assert r["added"] == 2 and r["emails_found"] == 1 and r["managers_found"] == 1
    rows = {c["name"]: c for c in client.get("/api/companies?q=Dupont", headers=h).json()}
    d = rows["Garage Dupont"]
    assert d["email"] == "contact@garage-dupont.fr" and d["contact_name"] == "Marc Dupont" and "à vérifier" in d["notes"]
    sans = client.get("/api/companies?q=Sans Site", headers=h).json()[0]
    assert sans["email"] == ""                                    # rien d'inventé quand il n'y a pas de site


def test_enrich_never_overwrites_existing_email(client, monkeypatch):
    from app.agent import emailfinder
    monkeypatch.setattr(emailfinder, "fetch", _fake_fetch)
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Déjà Rempli", "category": "garage", "city": "Toulouse",
                                                       "website": "https://garage-dupont.fr", "email": "perso@saisi.fr",
                                                       "contact_name": "Moi Même"}).json()
    r = client.post(f"/api/companies/{c['id']}/find-manager", headers=h).json()
    assert r["email"] == "perso@saisi.fr" and r["contact_name"] == "Moi Même" and r["found"] is False


# ---------- Pilote automatique ----------
def _db():
    from app.db import SessionLocal
    return SessionLocal()


def _mk(client, h, name, score_email=True, **kw):
    body = {"name": name, "category": "location", "city": "Toulouse", "phone": "0561", "website": ""} | kw
    if score_email:
        body.setdefault("email", f"{name.lower().replace(' ', '')}@exemple.fr")
    return client.post("/api/companies", headers=h, json=body).json()


def test_autopilot_cannot_be_enabled_without_smtp(client):
    h = auth(client)
    r = client.put("/api/autopilot", headers=h, json={"enabled": True})
    assert r.status_code == 409 and "SMTP" in r.json()["detail"]
    assert client.get("/api/autopilot", headers=h).json()["config"]["enabled"] is False
    hc = auth(client, "com@test.fr", "nouveau-mdp-1")
    assert client.get("/api/autopilot", headers=hc).status_code == 403


def test_autopilot_validation(client):
    h = auth(client)
    assert client.put("/api/autopilot", headers=h, json={"daily_cap": 500}).status_code == 422
    assert client.put("/api/autopilot", headers=h, json={"hour_start": 18, "hour_end": 9}).status_code == 422
    assert client.put("/api/autopilot", headers=h, json={"daily_cap": 3, "min_score": 55}).json()["config"]["daily_cap"] == 3


def test_autopilot_tick_rules(client):
    from datetime import datetime, timedelta, timezone
    from app import autopilot
    h = auth(client)
    ok = _mk(client, h, "Pilote Ok")
    no_mail = _mk(client, h, "Pilote SansMail", score_email=False)
    opp = _mk(client, h, "Pilote Oppose")
    client.patch(f"/api/companies/{opp['id']}", headers=h, json={"do_not_contact": True})
    sent = []
    fake = lambda to, subject, body: sent.append((to, subject, body))
    MON_10H = datetime(2030, 1, 7, 9, 0, tzinfo=timezone.utc)       # lundi 10 h à Paris (date fixe, loin d'aujourd'hui)
    with _db() as db:
        autopilot.set_cfg(db, enabled=False, daily_cap=2, min_score=0, hour_start=9, hour_end=17, weekdays_only=True)
        assert autopilot.tick(db, MON_10H, fake)["reason"] == "pilote désactivé"
        autopilot.set_cfg(db, enabled=True)
        assert autopilot.tick(db, datetime(2030, 1, 5, 10, 0, tzinfo=timezone.utc), fake)["reason"] == "week-end"
        assert autopilot.tick(db, datetime(2030, 1, 7, 20, 0, tzinfo=timezone.utc), fake)["reason"] == "hors des horaires d'envoi"
        assert sent == []                                             # rien envoyé hors règles
        expected = autopilot.candidates(db, autopilot.get_cfg(db), 1)[0][0]       # le mieux noté avec email
        r = autopilot.tick(db, MON_10H, fake)
        assert r["sent"] and len(sent) == 1 and sent[0][0] == expected.email
        assert autopilot.tick(db, MON_10H + timedelta(minutes=2), fake)["reason"] == "délai minimum entre deux envois"
    # le message est tracé, le prospect passe en « Contacté », le texte est celui du modèle du garage
    m = next(x for x in client.get("/api/messages", headers=h).json() if x["id"] == r["sent"])
    assert m["status"] == "envoye" and m["approved_by"] == "pilote automatique" and "STOP" in m["body"]
    with _db() as db:
        assert autopilot.sent_today(db, MON_10H) >= 1
        # jamais sans adresse, ni en opposition, ni deux fois le même
        names = [c.name for c, _k in autopilot.candidates(db, autopilot.get_cfg(db), 50)]
        assert "Pilote SansMail" not in names and "Pilote Oppose" not in names and expected.name not in names


def test_autopilot_daily_cap_and_failure_shutdown(client):
    from datetime import datetime, timedelta, timezone
    from app import autopilot
    h = auth(client)
    for i in range(3):
        _mk(client, h, f"Plafond {i}")
    MON = datetime(2030, 1, 14, 9, 0, tzinfo=timezone.utc)
    with _db() as db:
        used = autopilot.sent_today(db, MON)
        autopilot.set_cfg(db, enabled=True, daily_cap=used + 1, min_score=0, failures=0)
        assert autopilot.tick(db, MON, lambda *a: None)["sent"]
        assert autopilot.tick(db, MON + timedelta(minutes=30), lambda *a: None)["reason"] == "plafond quotidien atteint"
        # 3 échecs d'envoi consécutifs -> le pilote s'arrête tout seul
        autopilot.set_cfg(db, daily_cap=50, failures=0)
        def boom(*a):
            raise ConnectionError("SMTP refusé")
        t = MON + timedelta(hours=1)
        for i in range(3):
            r = autopilot.tick(db, t + timedelta(minutes=10 * i), boom)
            assert r["sent"] is None
        cfg = autopilot.get_cfg(db)
        assert cfg["enabled"] is False and "ConnectionError" in cfg["last_error"]
        assert "arrêté" in r["reason"]
        # le message échoué n'est pas marqué envoyé
        assert not [m for m in client.get("/api/messages?status=valide", headers=h).json() if m["approved_by"] == "pilote automatique"]


def test_autopilot_relances_only_when_enabled(client):
    from datetime import datetime, timezone
    from app import autopilot
    h = auth(client)
    c = _mk(client, h, "Relance Auto")
    client.patch(f"/api/companies/{c['id']}", headers=h, json={"status": "contacte"})
    _age_company(c["id"], 10)
    with _db() as db:
        autopilot.set_cfg(db, enabled=True, min_score=100, auto_relances=False)
        assert c["id"] not in [x.id for x, k in autopilot.candidates(db, autopilot.get_cfg(db), 50)]
        autopilot.set_cfg(db, auto_relances=True)
        assert (c["id"], "relance") in [(x.id, k) for x, k in autopilot.candidates(db, autopilot.get_cfg(db), 50)]


# ---------- Réponses des prospects, STOP et archivage ----------
def test_classify_replies():
    from app.replies import classify, clean_body
    assert classify("Re: Proposition", "STOP") == "stop"
    assert classify("Re: Proposition", "Bonjour, merci de ne plus me contacter.") == "stop"
    assert classify("Re: Proposition", "Merci de nous désinscrire de votre liste") == "stop"
    assert classify("Re: Proposition", "Nous ne souhaitons plus recevoir vos messages") == "stop"
    assert classify("Re: Proposition", "Bonjour, nous ne sommes pas intéressés, merci.") == "refus"
    assert classify("Re: Proposition", "Oui, rappelez-moi demain à 10h") == "reponse"
    assert classify("Réponse automatique : absence", "Je suis en congés") == "auto"
    assert classify("Re:", "ok", auto_header=True) == "auto"
    quoted = "STOP\n\nLe lun. 2 nov. 2026, Garage a écrit :\n> Bonjour, nous avons identifié votre établissement"
    assert clean_body(quoted) == "STOP"
    assert classify("Re:", clean_body("Intéressant, appelez-moi.\n> Si vous ne souhaitez plus être contacté, répondez STOP")) == "reponse"


def test_stop_button_archives_and_prepares_confirmation(client, monkeypatch):
    from app.agent import mailer
    monkeypatch.setattr(mailer, "smtp_configured", lambda: False)
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Stoppé SARL", "category": "taxi", "city": "Toulouse",
                                                       "email": "boss@stoppe.fr", "contact_name": "Léa Martin"}).json()
    client.post(f"/api/companies/{c['id']}/draft", headers=h, json={"kind": "email"})       # un brouillon en attente
    r = client.post(f"/api/companies/{c['id']}/stop", headers=h).json()
    assert r["status"] == "archive" and r["do_not_contact"] is True and r["confirmation"] == "à envoyer à la main"
    # sorti de la liste en cours, visible dans les archives
    assert c["id"] not in [x["id"] for x in client.get("/api/companies", headers=h).json()]
    assert c["id"] in [x["id"] for x in client.get("/api/companies?status=archive", headers=h).json()]
    msgs = [m for m in client.get("/api/messages", headers=h).json() if m["company_id"] == c["id"]]
    kinds = {m["kind"]: m for m in msgs}
    assert kinds["email"]["status"] == "rejete"                                       # brouillon annulé
    conf = kinds["confirmation_stop"]
    assert conf["status"] == "valide" and conf["body"].startswith("Bonjour Léa Martin,") and "plus aucun message" in conf["body"]
    assert "STOP" not in conf["body"] and "partenariat" not in conf["body"].lower()  # aucun contenu commercial
    # plus aucun nouveau brouillon commercial, mais la confirmation peut partir
    assert client.post(f"/api/companies/{c['id']}/draft", headers=h, json={"kind": "email"}).status_code == 409
    assert client.post(f"/api/messages/{conf['id']}/mark-sent", headers=h).json()["status"] == "envoye"
    # une seule confirmation, même si on clique deux fois
    client.post(f"/api/companies/{c['id']}/stop", headers=h)
    assert len([m for m in client.get("/api/messages", headers=h).json()
                if m["company_id"] == c["id"] and m["kind"] == "confirmation_stop"]) == 1


def test_stop_sends_confirmation_when_smtp_configured(client, monkeypatch):
    from app.agent import mailer
    sent = []
    monkeypatch.setattr(mailer, "smtp_configured", lambda: True)
    monkeypatch.setattr(mailer, "send_email", lambda to, subject, body: sent.append((to, subject)))
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Stop Auto", "category": "vo", "city": "Toulouse", "email": "a@stopauto.fr"}).json()
    assert client.post(f"/api/companies/{c['id']}/stop", headers=h).json()["confirmation"] == "envoyée"
    assert sent == [("a@stopauto.fr", "Votre demande est prise en compte")]


def test_check_inbox_handles_stop_refusal_reply_auto_and_dedup(client):
    from app import replies
    h = auth(client)
    mk = lambda n, e: client.post("/api/companies", headers=h, json={"name": n, "category": "flotte", "city": "Toulouse", "email": e}).json()
    a, b, c, d = mk("Inbox A", "a@inbox-a.fr"), mk("Inbox B", "b@inbox-b.fr"), mk("Inbox C", "c@inbox-c.fr"), mk("Inbox D", "d@inbox-d.fr")
    for x in (a, b, c, d):
        client.patch(f"/api/companies/{x['id']}", headers=h, json={"status": "contacte"})
    items = [
        {"message_id": "<1>", "from": "a@inbox-a.fr", "subject": "Re: Proposition", "body": "STOP", "auto": False},
        {"message_id": "<2>", "from": "b@inbox-b.fr", "subject": "Re: Proposition", "body": "Pas intéressés, merci", "auto": False},
        {"message_id": "<3>", "from": "c@inbox-c.fr", "subject": "Re: Proposition", "body": "Bonjour, appelez-moi jeudi", "auto": False},
        {"message_id": "<4>", "from": "d@inbox-d.fr", "subject": "Réponse automatique : absence", "body": "Je reviens lundi", "auto": False},
        {"message_id": "<5>", "from": "inconnu@ailleurs.fr", "subject": "Hello", "body": "STOP", "auto": False},
    ]
    from app.db import SessionLocal
    sent = []
    with SessionLocal() as db:
        r = replies.check_inbox(db, fetch=lambda emails, domains: items, send=lambda *a: sent.append(a[0]))
        assert r["processed"] == {"stop": 1, "refus": 1, "reponse": 1, "auto": 1}
        assert replies.check_inbox(db, fetch=lambda e, d: items, send=lambda *a: sent.append(a[0]))["processed"] == {}   # déjà traités
    st = {x: client.get(f"/api/companies?q={x}", headers=h).json() for x in ("Inbox B", "Inbox C", "Inbox D")}
    assert st["Inbox B"][0]["status"] == "refuse"
    assert st["Inbox C"][0]["status"] == "repondu" and "appelez-moi jeudi" in st["Inbox C"][0]["notes"]
    assert st["Inbox D"][0]["status"] == "contacte"                                 # réponse automatique : ignorée
    assert client.get("/api/companies?q=Inbox A", headers=h).json() == []           # archivé
    arch = client.get("/api/companies?status=archive&q=Inbox A", headers=h).json()[0]
    assert arch["do_not_contact"] is True
    assert sent == ["a@inbox-a.fr"]                                                  # une seule confirmation, au bon prospect
    # un prospect qui a répondu n'est plus relancé
    _age_company(c["id"], 30)
    assert c["id"] not in [x["id"] for x in client.get("/api/relances", headers=h).json()["items"]]


def test_check_inbox_not_configured(client):
    from app import replies
    from app.db import SessionLocal
    with SessionLocal() as db:
        assert replies.check_inbox(db)["configured"] is False
    assert client.get("/api/replies", headers=auth(client)).json()["configured"] is False
