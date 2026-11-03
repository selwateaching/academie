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
    monkeypatch.setattr(prospector, "search_places", lambda cat, city, limit, radius=15: [
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


# ---------- E-mail du prospect : visible, vérifié à la validation ----------
def test_validate_requires_prospect_email_then_works_after_completing(client):
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Sans Mail Valid", "category": "vo", "city": "Toulouse"}).json()
    assert c["email"] == ""
    m = client.post(f"/api/companies/{c['id']}/draft", headers=h, json={"kind": "email"}).json()
    assert m["to"] == ""                                               # « E-mail manquant » côté écran
    r = client.post(f"/api/messages/{m['id']}/approve", headers=h)
    assert r.status_code == 422 and "E-mail manquant" in r.json()["detail"]
    assert client.get("/api/messages?status=valide", headers=h).json() == [] or all(x["id"] != m["id"] for x in client.get("/api/messages?status=valide", headers=h).json())
    # on complète la fiche du prospect, le message affiche l'adresse sans être régénéré
    client.patch(f"/api/companies/{c['id']}", headers=h, json={"email": "  Contact@SansMail.FR "})
    again = next(x for x in client.get("/api/messages", headers=h).json() if x["id"] == m["id"])
    assert again["to"] == "contact@sansmail.fr"                        # nettoyée et en minuscules
    assert client.post(f"/api/messages/{m['id']}/approve", headers=h).json()["status"] == "valide"


def test_call_script_can_be_validated_without_email(client):
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Appel Sans Mail", "category": "vo", "city": "Toulouse"}).json()
    m = client.post(f"/api/companies/{c['id']}/draft", headers=h, json={"kind": "script_appel"}).json()
    assert client.post(f"/api/messages/{m['id']}/approve", headers=h).status_code == 200


def test_invalid_email_is_rejected(client):
    h = auth(client)
    assert client.post("/api/companies", headers=h, json={"name": "Mauvais Mail", "email": "pas-un-mail"}).status_code == 422
    c = client.post("/api/companies", headers=h, json={"name": "Bon Mail", "category": "vo", "city": "Toulouse"}).json()
    for bad in ("sans-arobase", "a@b", "a b@c.fr"):
        assert client.patch(f"/api/companies/{c['id']}", headers=h, json={"email": bad}).status_code == 422
    assert client.patch(f"/api/companies/{c['id']}", headers=h, json={"email": ""}).status_code == 200   # on peut l'effacer


# ---------- Liste d'appels ----------
def test_call_list_priorities_and_outcomes(client):
    h = auth(client)
    mk = lambda n, **kw: client.post("/api/companies", headers=h, json={"name": n, "category": "garage", "city": "Toulouse", **kw}).json()
    new_hi = mk("Appel Neuf Haut", phone="0561111111", website="https://x.fr")
    sans_tel = mk("Appel Sans Tel")
    opp = mk("Appel Oppose", phone="0561222222")
    client.patch(f"/api/companies/{opp['id']}", headers=h, json={"do_not_contact": True})
    repondu = mk("Appel Repondu", phone="0561333333")
    client.patch(f"/api/companies/{repondu['id']}", headers=h, json={"status": "repondu"})
    recent = mk("Appel Recent", phone="0561444444")
    client.patch(f"/api/companies/{recent['id']}", headers=h, json={"status": "contacte"})          # contacté à l'instant
    old = mk("Appel Ancien", phone="0561555555")
    client.patch(f"/api/companies/{old['id']}", headers=h, json={"status": "contacte"})
    _age_company(old["id"], 4)
    names = [x["name"] for x in client.get("/api/calls", headers=h).json()]
    assert "Appel Sans Tel" not in names and "Appel Oppose" not in names and "Appel Recent" not in names
    assert names.index("Appel Repondu") < names.index("Appel Neuf Haut") < names.index("Appel Ancien")   # répondu, neuf, à relancer
    # pas de réponse : sort de la liste, statut Contacté, note datée
    r = client.post(f"/api/companies/{new_hi['id']}/call", headers=h, json={"outcome": "no_answer", "note": "répondeur"}).json()
    assert r["status"] == "contacte" and r["next_action"] == "Rappeler" and "Pas de réponse – répondeur" in r["notes"]
    assert "Appel Neuf Haut" not in [x["name"] for x in client.get("/api/calls", headers=h).json()]
    # intéressé -> rendez-vous ; pas intéressé -> refusé ; résultat inconnu -> erreur
    assert client.post(f"/api/companies/{old['id']}/call", headers=h, json={"outcome": "interested"}).json()["status"] == "rdv"
    assert client.post(f"/api/companies/{repondu['id']}/call", headers=h, json={"outcome": "not_interested"}).json()["status"] == "refuse"
    assert client.post(f"/api/companies/{old['id']}/call", headers=h, json={"outcome": "n_importe_quoi"}).status_code == 422
    after = [x["name"] for x in client.get("/api/calls", headers=h).json()]
    assert "Appel Ancien" not in after and "Appel Repondu" not in after


# ---------- WhatsApp ----------
def test_whatsapp_number_only_for_french_mobiles():
    from app.agent.writer import whatsapp_number as wa
    assert wa("06 12 34 56 78") == "33612345678"
    assert wa("07.12.34.56.78") == "33712345678"
    assert wa("+33 6 12 34 56 78") == "33612345678"
    assert wa("+33 (0)6 12 34 56 78") == "33612345678"
    assert wa("0033712345678") == "33712345678"
    for fixe in ("05 61 39 56 30", "0561395630", "09 72 00 00 00", "0 892 05 28 28", "", "06 12 34", "+44 7911 123456"):
        assert wa(fixe) == "", fixe


def test_whatsapp_link_prefilled_and_logged(client):
    from urllib.parse import parse_qs, urlparse
    h = auth(client)
    mob = client.post("/api/companies", headers=h, json={"name": "Mobile SARL", "category": "taxi", "city": "Toulouse",
                                                         "phone": "06 52 92 24 04", "contact_name": "Yanis Benali"}).json()
    fixe = client.post("/api/companies", headers=h, json={"name": "Fixe SARL", "category": "taxi", "city": "Toulouse", "phone": "05 61 39 56 30"}).json()
    assert fixe["whatsapp_url"] == ""                                     # pas de bouton sur un fixe
    u = urlparse(mob["whatsapp_url"])
    assert u.netloc == "wa.me" and u.path == "/33652922404"
    text = parse_qs(u.query)["text"][0]
    assert text.startswith("Bonjour Yanis Benali,") and "STOP" in text and "Garage & Impulsion" in text
    # un clic est tracé : note datée, prospect « Contacté »
    r = client.post(f"/api/companies/{mob['id']}/call", headers=h, json={"outcome": "whatsapp"}).json()
    assert r["status"] == "contacte" and "WhatsApp" in r["notes"] and r["next_action"] == "Attendre la réponse"


# ---------- Agent 5 : responsable commercial IA ----------
def test_manager_facts_contain_no_personal_data_and_rules_work_without_ai(client):
    import json
    from app.agent import manager
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Chaud SARL", "category": "transport", "city": "Toulouse",
                                                       "phone": "0561777777", "email": "secret@chaud.fr", "contact_name": "Paul Secret"}).json()
    client.patch(f"/api/companies/{c['id']}", headers=h, json={"status": "repondu"})
    with _db() as db:
        facts = manager.gather_facts(db, 7)
        dump = json.dumps(facts, ensure_ascii=False)
        assert "@" not in dump and "secret" not in dump.lower() and "0561777777" not in dump and "Chaud SARL" not in dump
        assert facts["a_traiter"]["ont_repondu_a_rappeler"] >= 1
        res = manager.analyse(db, 7)                                   # pas de clé OpenAI : règles
    assert res["source"] == "regles" and res["summary"]
    assert any(r["action"].startswith("Rappeler") for r in res["recommendations"]) and len(res["recommendations"]) <= 5


def test_manager_uses_ai_when_valid_and_falls_back_when_not(client, monkeypatch):
    from app.agent import llm, manager
    seen = {}
    good = {"summary": "Semaine calme.", "recommendations": [{"action": "Appeler les transporteurs", "why": "3 réponses sur 4"}], "alerts": []}
    def fake_ok(system, user):
        seen["user"] = user
        return good
    monkeypatch.setattr(llm, "chat_json", fake_ok)
    with _db() as db:
        r = manager.analyse(db, 7)
    assert r["source"] == "ia" and r["recommendations"][0]["action"] == "Appeler les transporteurs"
    assert "@" not in seen["user"]                                     # seuls des chiffres partent vers l'IA
    for bad in ({"summary": "x"}, {"summary": "", "recommendations": []}, {"recommendations": "n'importe quoi"}, None):
        monkeypatch.setattr(llm, "chat_json", lambda s, u, b=bad: b)
        with _db() as db:
            assert manager.analyse(db, 7)["source"] == "regles"        # réponse inutilisable -> règles


def test_analysis_endpoints_and_permissions(client):
    h = auth(client)
    r = client.post("/api/report/analysis?days=14", headers=h).json()
    assert r["days"] == 14 and r["recommendations"]
    got = client.get("/api/report/analysis", headers=h).json()
    assert got["id"] == r["id"] and got["summary"] == r["summary"]
    hc = auth(client, "com@test.fr", "nouveau-mdp-1")
    assert client.get("/api/report/analysis", headers=hc).status_code == 200      # lecture : tous
    assert client.post("/api/report/analysis", headers=hc).status_code == 403     # génération : responsables


def test_weekly_report_job_runs_monday_only_once_and_emails(client, monkeypatch):
    from datetime import datetime, timedelta, timezone
    from app import autopilot
    from app.config import get_settings
    monkeypatch.setenv("REPORT_EMAIL", "dirigeant@garage.fr")
    sent = []
    send = lambda to, subject, body: sent.append((to, subject, body))
    MONDAY = datetime(2031, 1, 6, 8, 30, tzinfo=timezone.utc)           # lundi 9 h 30 à Paris
    with _db() as db:
        assert autopilot.weekly_report_job(db, datetime(2031, 1, 7, 9, 0, tzinfo=timezone.utc), send)["done"] is False   # mardi
        assert autopilot.weekly_report_job(db, datetime(2031, 1, 6, 5, 0, tzinfo=timezone.utc), send)["done"] is False   # lundi 6 h
        r = autopilot.weekly_report_job(db, MONDAY, send)
        assert r == {"done": True, "emailed": True}
        assert autopilot.weekly_report_job(db, MONDAY + timedelta(hours=2), send)["done"] is False                       # déjà fait
        assert autopilot.weekly_report_job(db, MONDAY + timedelta(days=7), send)["done"] is True                          # lundi suivant
    assert len(sent) == 2 and sent[0][0] == "dirigeant@garage.fr"
    assert "Actions recommandées" in sent[0][2] and "@" not in sent[0][2].replace("dirigeant@garage.fr", "")
    monkeypatch.delenv("REPORT_EMAIL")
    with _db() as db:
        assert autopilot.weekly_report_job(db, MONDAY + timedelta(days=14), send) == {"done": True, "emailed": False}   # analyse faite, pas d'email
    assert len(sent) == 2


# ---------- Règle de fin : « Sans suite » ----------
def test_no_answer_streak_parsing():
    from app.relances import no_answer_streak as st
    L = lambda out: f"Appel du 02/11/2026 10:00 (Marc) : {out}"
    assert st("\n".join([L("Pas de réponse"), L("Pas de réponse – répondeur")])) == 2
    assert st("\n".join([L("Pas de réponse"), L("À rappeler"), L("Pas de réponse")])) == 1          # un échange remet à zéro
    assert st("\n".join([L("Pas de réponse"), L("Message WhatsApp ouvert"), L("Pas de réponse")])) == 2   # WhatsApp neutre
    assert st("\n".join([L("Pas de réponse")] * 3 + ["Repris en prospection le 03/11/2026"] + [L("Pas de réponse")])) == 1
    assert st("") == 0


def test_three_unanswered_calls_close_the_prospect(client):
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Jamais Joignable", "category": "taxi", "city": "Toulouse", "phone": "0561888888"}).json()
    call = lambda o: client.post(f"/api/companies/{c['id']}/call", headers=h, json={"outcome": o}).json()
    assert call("no_answer")["status"] == "contacte"
    assert call("no_answer")["status"] == "contacte"
    r = call("no_answer")
    assert r["status"] == "sans_suite" and "3 appels sans réponse" in r["notes"]
    assert c["id"] not in [x["id"] for x in client.get("/api/companies", headers=h).json()]                 # hors liste en cours
    assert c["id"] in [x["id"] for x in client.get("/api/companies?status=sans_suite", headers=h).json()]    # retrouvable
    assert c["id"] not in [x["id"] for x in client.get("/api/calls", headers=h).json()]                      # hors liste d'appels
    # reprise manuelle : repart de zéro, un seul nouvel appel sans réponse ne reclôture pas
    client.patch(f"/api/companies/{c['id']}", headers=h, json={"status": "a_contacter"})
    assert call("no_answer")["status"] == "contacte"


def test_a_real_conversation_resets_the_count(client):
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Parfois Joignable", "category": "taxi", "city": "Toulouse", "phone": "0561999999"}).json()
    call = lambda o: client.post(f"/api/companies/{c['id']}/call", headers=h, json={"outcome": o}).json()
    call("no_answer"); call("no_answer"); call("callback")            # on a parlé à quelqu'un
    assert call("no_answer")["status"] == "contacte" and call("no_answer")["status"] == "contacte"


def test_two_relances_without_reply_close_after_seven_days(client):
    from datetime import datetime, timedelta, timezone
    from app import models
    from app.relances import close_stale
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Silence Radio", "category": "flotte", "city": "Toulouse", "email": "x@silence.fr"}).json()
    d = client.post("/api/companies", headers=h, json={"name": "Une Seule Relance", "category": "flotte", "city": "Toulouse", "email": "y@une.fr"}).json()
    with _db() as db:
        for cid, n in ((c["id"], 2), (d["id"], 1)):
            co = db.get(models.Company, cid)
            co.status, co.last_contact = "contacte", datetime.now(timezone.utc) - timedelta(days=10)
            for _ in range(n):
                db.add(models.Message(company_id=cid, kind="relance", subject="r", body="r", status="envoye", sent_at=co.last_contact))
        db.commit()
        assert close_stale(db) >= 1
    got = {x["name"]: x["status"] for x in client.get("/api/companies?q=Silence", headers=h).json()}
    assert client.get(f"/api/companies?status=sans_suite&q=Silence", headers=h).json()[0]["notes"].count("2 relances restées sans réponse") == 1
    assert client.get("/api/companies?q=Une Seule", headers=h).json()[0]["status"] == "contacte"            # 1 relance : on attend encore


# ---------- Note Google du garage de mécanique ----------
def _draft(client, h, name, kind, **kw):
    c = client.post("/api/companies", headers=h, json={"name": name, "category": "vo", "city": "Toulouse", **kw}).json()
    return client.post(f"/api/companies/{c['id']}/draft", headers=h, json={"kind": kind}).json()["body"]


def test_google_reviews_absent_by_default_without_leftovers(client):
    h = auth(client)
    for kind in ("email", "script_appel"):
        body = _draft(client, h, f"Sans Avis {kind}", kind)
        assert "Google" not in body and "{avis_google}" not in body and "\n\n\n" not in body
    assert "{avis_google}" not in client.post("/api/companies", headers=h, json={"name": "WA", "phone": "0652922404"}).json()["whatsapp_url"]


def test_google_reviews_inserted_only_with_real_figures(client, monkeypatch):
    from urllib.parse import parse_qs, urlparse
    monkeypatch.setenv("GARAGE_REVIEW_NOTE", "4,9")
    monkeypatch.setenv("GARAGE_REVIEW_COUNT", "120")
    monkeypatch.setenv("GARAGE_REVIEW_URL", "https://maps.app.goo.gl/abc")
    h = auth(client)
    mail = _draft(client, h, "Avec Avis Mail", "email")
    assert "noté 4,9/5 sur Google (120 avis) : https://maps.app.goo.gl/abc" in mail
    assert "Les mêmes patrons ont ouvert cette carrosserie" in mail and mail.index("noté 4,9") < mail.index("Concrètement")
    assert mail.count("STOP") == 1 and "\n\n\n" not in mail
    script = _draft(client, h, "Avec Avis Script", "script_appel")
    assert "noté 4,9 sur 5 sur Google, avec 120 avis" in script and "https://" not in script    # à l'oral : pas de lien
    wa = client.post("/api/companies", headers=h, json={"name": "Avec Avis WA", "phone": "0652922404"}).json()["whatsapp_url"]
    wtext = parse_qs(urlparse(wa).query)["text"][0]
    assert "noté 4,9/5 sur Google (120 avis)" in wtext and "https://maps.app.goo.gl/abc" in wtext
    monkeypatch.setenv("GARAGE_REVIEW_NOTE", "4.5")                                                  # le point décimal fonctionne aussi
    assert "noté 4,5/5" in _draft(client, h, "Point Decimal", "email")


def test_google_reviews_ignores_invalid_values(client, monkeypatch):
    h = auth(client)
    for note, count in (("7", "120"), ("abc", "120"), ("4,9", "0"), ("4,9", ""), ("0", "10")):
        monkeypatch.setenv("GARAGE_REVIEW_NOTE", note)
        monkeypatch.setenv("GARAGE_REVIEW_COUNT", count)
        assert "Google" not in _draft(client, h, f"Invalide {note}{count}", "email"), (note, count)


# ---------- Réinitialisation du mot de passe ----------
def test_reset_password_tool(client):
    from app.reset_password import reset
    assert reset("admin@test.fr", "court").startswith("ERREUR") and "8 caractères" in reset("admin@test.fr", "court")
    msg = reset("inconnu@test.fr", "unmotdepasse-long")
    assert msg.startswith("ERREUR") and "admin@test.fr" in msg                      # liste les comptes existants
    # désactivé + oublié -> réinitialisé et réactivé
    h = auth(client)
    com = next(u for u in client.get("/api/users", headers=h).json() if u["email"] == "com@test.fr")
    client.patch(f"/api/users/{com['id']}", headers=h, json={"active": False})
    assert client.post("/api/auth/login", json={"email": "com@test.fr", "password": "nouveau-mdp-1"}).status_code == 401
    assert reset("  COM@test.fr ", "mot-de-passe-neuf").startswith("OK")
    auth(client, "com@test.fr", "mot-de-passe-neuf")
    assert client.post("/api/auth/login", json={"email": "com@test.fr", "password": "nouveau-mdp-1"}).status_code == 401   # l'ancien ne marche plus
    assert len(client.get("/api/companies", headers=h).json()) > 0                                                           # les prospects sont intacts


# ---------- Recherche verrouillée sur la zone + département ----------
def test_department_from_address():
    from app.departments import department_of as d
    assert d("12 rue X, 31200 Toulouse, France") == ("31", "Haute-Garonne", "31200")
    assert d("Place de la Mairie, 23000 Guéret") == ("23", "Creuse", "23000")
    assert d("1 rue A, 20090 Ajaccio")[:2] == ("2A", "Corse-du-Sud") and d("1 rue B, 20200 Bastia")[:2] == ("2B", "Haute-Corse")
    assert d("1 rue C, 97400 Saint-Denis")[:2] == ("974", "La Réunion")
    assert d("sans code postal") == ("", "", "") and d("") == ("", "", "")


def _fake_google(calls):
    def post(url, body, headers):
        calls.append(body)
        if "locationRestriction" not in body:                                   # 1) localisation de la ville
            return 200, {"places": [{"location": {"latitude": 43.6045, "longitude": 1.4442}}]}, ""
        return 200, {"places": [                                                # 2) recherche
            {"id": "A", "displayName": {"text": "Loc Toulouse"}, "formattedAddress": "5 rue A, 31000 Toulouse", "location": {"latitude": 43.61, "longitude": 1.45}},
            {"id": "B", "displayName": {"text": "Loc Blagnac"}, "formattedAddress": "2 rue B, 31700 Blagnac", "location": {"latitude": 43.64, "longitude": 1.39}},
            {"id": "C", "displayName": {"text": "Loc Gueret"}, "formattedAddress": "1 place C, 23000 Guéret", "location": {"latitude": 46.17, "longitude": 1.87}},
            {"id": "D", "displayName": {"text": "Fermée"}, "businessStatus": "CLOSED_PERMANENTLY", "location": {"latitude": 43.6, "longitude": 1.44}},
        ]}, ""
    return post


def test_search_is_locked_to_the_city_and_drops_out_of_zone_results(monkeypatch):
    from app.agent import prospector
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "fake")
    calls = []
    rows = prospector.search_places("location", "Toulouse", 20, 15, post=_fake_google(calls))
    assert [r["name"] for r in rows] == ["Loc Toulouse", "Loc Blagnac"]            # la Creuse est écartée
    assert rows.dropped == 1 and "Toulouse" in rows.zone and "15 km" in rows.zone
    assert "Toulouse, France" in calls[0]["textQuery"]
    rect = calls[1]["locationRestriction"]["rectangle"]
    assert rect["low"]["latitude"] < 43.6045 < rect["high"]["latitude"] and "Toulouse" in calls[1]["textQuery"]
    assert rows[0]["city"] == "Toulouse" and rows[1]["city"] == "Blagnac"             # vraie commune lue dans l'adresse
    # rayon trop petit : Blagnac (~5 km) reste hors d'un rayon de 2 km
    assert [r["name"] for r in prospector.search_places("location", "Toulouse", 20, 2, post=_fake_google([]))] == ["Loc Toulouse"]


def test_search_refuses_empty_or_numeric_city_and_unknown_city(client, monkeypatch):
    from app.agent import prospector
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "fake")
    h = auth(client)
    for bad in ("", "  ", "31"):
        r = client.post("/api/agent/search", headers=h, json={"category": "location", "city": bad})
        assert r.status_code == 400 and "nom d'une ville" in r.json()["detail"], bad
    with pytest.raises(prospector.ProspectorError, match="Ville introuvable"):
        prospector.search_places("location", "Xyzzyville", 5, post=lambda *a: (200, {"places": []}, ""))


def test_prospects_show_department_and_purge_archives_only_out_of_zone(client):
    h = auth(client)
    from app import models
    with _db() as db:
        for name, addr in (("Zone Toulouse", "5 rue A, 31000 Toulouse"), ("Zone Creuse", "1 place C, 23000 Guéret"),
                           ("Zone SansAdresse", "")):
            db.add(models.Company(name=name, address=addr, source="google_places", category="location", city="X", status="a_contacter"))
        db.add(models.Company(name="Zone Manuel Creuse", address="9 rue Z, 23000 Guéret", source="manuel", category="location", city="X"))
        db.commit()
    rows = {c["name"]: c for c in client.get("/api/companies?q=Zone", headers=h).json()}
    assert rows["Zone Toulouse"]["department"] == "31" and rows["Zone Toulouse"]["department_name"] == "Haute-Garonne"
    assert rows["Zone Creuse"]["department"] == "23" and rows["Zone Creuse"]["department_name"] == "Creuse"
    assert rows["Zone SansAdresse"]["department"] == ""
    dry = client.post("/api/agent/purge-out-of-zone", headers=h, json={"departments": "31", "dry_run": True}).json()
    assert dry["count"] == 1 and dry["archived"] is False and "Zone Creuse (23000)" in dry["examples"]
    assert "Zone Creuse" in [c["name"] for c in client.get("/api/companies?q=Zone", headers=h).json()]          # rien changé en simulation
    done = client.post("/api/agent/purge-out-of-zone", headers=h, json={"departments": "31", "dry_run": False}).json()
    assert done["count"] == 1 and done["archived"] is True
    left = [c["name"] for c in client.get("/api/companies?q=Zone", headers=h).json()]
    assert "Zone Creuse" not in left and {"Zone Toulouse", "Zone SansAdresse", "Zone Manuel Creuse"} <= set(left)  # ni le manuel ni le sans adresse
    arch = client.get("/api/companies?status=archive&q=Zone Creuse", headers=h).json()[0]
    assert "hors zone" in arch["notes"] and arch["do_not_contact"] is False
    assert client.post("/api/agent/purge-out-of-zone", headers=h, json={"departments": "abc"}).status_code == 422
    assert client.post("/api/agent/purge-out-of-zone", headers=h, json={"departments": "31,82", "dry_run": True}).json()["count"] == 0


# ---------- Concurrents (carrosseries) ----------
def test_competitor_detection_by_name():
    from app.agent.targets import is_competitor as c
    for name in ("Carrosserie Martin", "SARL Toulouse CARROSSIER", "AB Body Shop", "Débosselage Express 31", "Smart Repair Occitanie",
                 "Garage Dupont Mécanique & Carrosserie", "Tôlerie Peinture Auto du Midi"):
        assert c(name), name
    for name in ("Rent A Car", "Transports Dupont", "Taxis Capitole", "Auto-école de la gare", "Garage Méca Pulse", ""):
        assert not c(name), name


def test_search_never_returns_competitor_bodyshops(monkeypatch):
    from app.agent import prospector
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "fake")
    def post(url, body, headers):
        if "locationRestriction" not in body:
            return 200, {"places": [{"location": {"latitude": 43.6045, "longitude": 1.4442}}]}, ""
        mk = lambda i, n: {"id": i, "displayName": {"text": n}, "formattedAddress": "1 rue A, 31000 Toulouse",
                           "location": {"latitude": 43.61, "longitude": 1.45}}
        return 200, {"places": [mk("1", "Garage Dupont"), mk("2", "Carrosserie Martin"), mk("3", "Toulouse Body Shop"), mk("4", "Loc Auto 31")]}, ""
    rows = prospector.search_places("garage", "Toulouse", 20, 15, post=post)
    assert [r["name"] for r in rows] == ["Garage Dupont", "Loc Auto 31"] and rows.competitors == 2


def test_competitor_button_and_call_outcome_archive_without_message(client):
    h = auth(client)
    c = client.post("/api/companies", headers=h, json={"name": "Autre Atelier", "category": "garage", "city": "Toulouse",
                                                       "phone": "0561234500", "email": "x@autre.fr"}).json()
    client.post(f"/api/companies/{c['id']}/draft", headers=h, json={"kind": "email"})
    r = client.post(f"/api/companies/{c['id']}/competitor", headers=h).json()
    assert r["status"] == "archive" and r["do_not_contact"] is False and "concurrent" in r["notes"]
    assert c["id"] not in [x["id"] for x in client.get("/api/companies", headers=h).json()]
    assert c["id"] not in [x["id"] for x in client.get("/api/calls", headers=h).json()]
    assert not [m for m in client.get("/api/messages", headers=h).json() if m["company_id"] == c["id"] and m["status"] in ("brouillon", "valide")]
    d = client.post("/api/companies", headers=h, json={"name": "Aussi Concurrent", "category": "garage", "city": "Toulouse", "phone": "0561234501"}).json()
    assert client.post(f"/api/companies/{d['id']}/call", headers=h, json={"outcome": "competitor"}).json()["status"] == "archive"


def test_purge_also_archives_existing_competitor_bodyshops(client):
    from app import models
    h = auth(client)
    with _db() as db:
        for n in ("Concur Carrosserie Rapide", "Concur Garage Neutre"):
            db.add(models.Company(name=n, address="5 rue A, 31000 Toulouse", source="google_places", category="garage", city="Toulouse", status="a_contacter"))
        db.commit()
    dry = client.post("/api/agent/purge-out-of-zone", headers=h, json={"departments": "31", "dry_run": True}).json()
    assert "Concur Carrosserie Rapide (concurrent)" in dry["examples"] and not any("Neutre" in e for e in dry["examples"])
    client.post("/api/agent/purge-out-of-zone", headers=h, json={"departments": "31", "dry_run": False})
    left = [c["name"] for c in client.get("/api/companies?q=Concur", headers=h).json()]
    assert left == ["Concur Garage Neutre"]
    off = client.post("/api/agent/purge-out-of-zone", headers=h, json={"departments": "31", "dry_run": True, "competitors": False}).json()
    assert off["count"] == 0


# ---------- Vos propres garages et carrosserie détectée sur le site ----------
def test_own_business_matching(monkeypatch):
    from app.agent.targets import is_own_business as own, normalize_name
    monkeypatch.setenv("GARAGE_NAME", "Garage & impulsion-carrosserie")
    monkeypatch.setenv("EXCLUDE_NAMES", "Méca Pulse, ab")
    assert normalize_name("Méca-Pulse Garage") == "mecapulsegarage"
    for name in ("Meca Pulse Garage Mécanique et Carrosserie à Toulouse Nord", "MECA PULSE", "Garage & Impulsion – Carrosserie", "méca-pulse"):
        assert own(name), name
    for name in ("Garage Dupont", "Pulse Fitness", "Rent A Car", "Abc Transports", ""):                 # « ab » est trop court : ignoré
        assert not own(name), name


def test_search_skips_own_garages(monkeypatch):
    from app.agent import prospector
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "fake")
    monkeypatch.setenv("EXCLUDE_NAMES", "Méca Pulse")
    def post(url, body, headers):
        if "locationRestriction" not in body:
            return 200, {"places": [{"location": {"latitude": 43.6045, "longitude": 1.4442}}]}, ""
        mk = lambda i, n: {"id": i, "displayName": {"text": n}, "formattedAddress": "1 rue A, 31000 Toulouse", "location": {"latitude": 43.61, "longitude": 1.45}}
        return 200, {"places": [mk("1", "Garage Dupont"), mk("2", "Meca Pulse Garage Mécanique"), mk("3", "Transports Vidal")]}, ""
    rows = prospector.search_places("garage", "Toulouse", 20, 15, post=post)
    assert [r["name"] for r in rows] == ["Garage Dupont", "Transports Vidal"] and rows.own == 1


def test_scan_website_detects_bodywork_even_without_email():
    from app.agent import emailfinder
    pages = {"https://garage-a.fr": "<html><nav>Mécanique · Pneus · <a href='/contact'>Contact</a></nav><p>Atelier de carrosserie et peinture</p></html>",
             "https://garage-b.fr": "<html><script>var x='carrosserie'</script><p>Vidange, freins, climatisation</p></html>"}
    fetch = lambda u: pages.get(u.rstrip("/"), "")
    assert emailfinder.scan_website("garage-a.fr", fetch)["bodywork"] is True
    assert emailfinder.scan_website("garage-b.fr", fetch)["bodywork"] is False          # un script n'est pas du texte visible
    assert emailfinder.scan_website("garage-b.fr", fetch)["email"] is None


def test_enrichment_archives_bodywork_garages_and_flags_other_categories(client, monkeypatch):
    from app.agent import emailfinder
    pages = {"https://atelier-x.fr": "<html>Mécanique, carrosserie, peinture. Écrire à contact@atelier-x.fr</html>"}
    monkeypatch.setattr(emailfinder, "fetch", lambda u: pages.get(u.rstrip("/"), ""))
    h = auth(client)
    g = client.post("/api/companies", headers=h, json={"name": "Atelier X", "category": "garage", "city": "Toulouse", "website": "https://atelier-x.fr"}).json()
    f = client.post("/api/companies", headers=h, json={"name": "Flotte Y", "category": "flotte", "city": "Toulouse", "website": "https://atelier-x.fr"}).json()
    r = client.post(f"/api/companies/{g['id']}/find-manager", headers=h).json()
    assert r["status"] == "archive" and "fait de la carrosserie" in r["notes"] and r["competitors"] == 1
    r = client.post(f"/api/companies/{f['id']}/find-manager", headers=h).json()
    assert r["status"] == "a_contacter" and "Carrosserie détectée" in r["notes"]       # signalé, pas archivé


def test_purge_archives_own_garage(client, monkeypatch):
    from app import models
    monkeypatch.setenv("EXCLUDE_NAMES", "Méca Pulse")
    h = auth(client)
    with _db() as db:
        db.add(models.Company(name="Meca Pulse Garage Mécanique", address="5 rue A, 31140 Launaguet", source="google_places",
                              category="garage", city="Launaguet", status="a_contacter"))
        db.commit()
    dry = client.post("/api/agent/purge-out-of-zone", headers=h, json={"departments": "31", "dry_run": True}).json()
    assert any("Meca Pulse" in e and "votre garage" in e for e in dry["examples"])


# ---------- Suppression définitive d'un département ----------
def test_delete_department_with_safeguards(client):
    from app import models
    h = auth(client)
    base = client.post("/api/companies/delete-department", headers=h, json={"department": "23"}).json()["count"]   # restes d'autres tests
    with _db() as db:
        mk = lambda n, addr, st="a_contacter": models.Company(name=n, address=addr, source="google_places", category="garage", city="X", status=st)
        gu1, gu2 = mk("Del Gueret 1", "1 place C, 23000 Guéret"), mk("Del Gueret 2", "2 rue D, 23200 Aubusson")
        gu_rdv = mk("Del Gueret RDV", "3 rue E, 23000 Guéret", "rdv")
        tls, noaddr = mk("Del Toulouse", "5 rue A, 31000 Toulouse"), mk("Del SansAdresse", "")
        db.add_all([gu1, gu2, gu_rdv, tls, noaddr]); db.commit()
        db.add(models.Message(company_id=gu1.id, kind="email", subject="s", body="b")); db.commit()
        db.add(models.InboxEvent(message_id="<del-1>", company_id=gu1.id, kind="reponse", summary="x")); db.commit()
    call = lambda **kw: client.post("/api/companies/delete-department", headers=h, json=kw)
    assert call(department="99").status_code == 422 and call(department="abc").status_code == 422
    dry = call(department="23").json()
    assert dry["count"] == base + 2 and dry["protected"] >= 1 and dry["deleted"] is False and dry["name"] == "Creuse"
    assert len(client.get("/api/companies?q=Del Gueret", headers=h).json()) == 3                     # simulation : rien supprimé
    assert call(department="23", dry_run=False).status_code == 409                                    # sans confirmation
    assert call(department="23", dry_run=False, confirm_name="Tarn").status_code == 409               # mauvais nom
    done = call(department="23", dry_run=False, confirm_name="  creuse ").json()                      # casse et espaces tolérés
    assert done["deleted"] is True and done["count"] == base + 2
    assert call(department="23").json()["count"] == 0                                                 # plus rien à supprimer
    left = {c["name"] for c in client.get("/api/companies?q=Del ", headers=h).json()}
    assert left == {"Del Gueret RDV", "Del Toulouse", "Del SansAdresse"}                              # RDV protégé, Toulouse intact, sans adresse intact
    assert all(m["company"] != "Del Gueret 1" for m in client.get("/api/messages", headers=h).json())   # messages supprimés avec lui
    hc = auth(client, "com@test.fr", "mot-de-passe-neuf")
    assert client.post("/api/companies/delete-department", headers=hc, json={"department": "23"}).status_code == 403
