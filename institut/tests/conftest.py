import os
import sys
import tempfile

_tmp = tempfile.mkdtemp(prefix="institut-test-")
os.environ.update(INSTITUT_INSTANCE=_tmp, INSTITUT_NO_WORKER="1", INSTITUT_ADMIN_PASSWORD="admin-test-password",
                  INSTITUT_SEED_DEMO="0", INSTITUT_SECRET="test-secret")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402

H = {"X-Requested-With": "institut"}


@pytest.fixture(scope="session")
def app():
    import app as A
    return A.create_app()


@pytest.fixture()
def anon(app):
    return app.test_client()


@pytest.fixture()
def pro(app):
    c = app.test_client()
    assert c.post("/api/auth/login", json={"email": "pro@institut.local", "password": "admin-test-password"}, headers=H).status_code == 200
    return c


_n = {"i": 0}


@pytest.fixture()
def client(app):
    """Cliente connectée (compte neuf)."""
    import web
    web._attempts.clear()  # la limite anti-abus ne doit pas gêner les tests
    _n["i"] += 1
    c = app.test_client()
    r = c.post("/api/auth/register", json={"email": f"cl{_n['i']}@example.com", "password": "motdepasse1", "first_name": "Léa", "last_name": "Test", "consent_data": True}, headers=H)
    assert r.status_code == 201, r.json
    c.uid = r.json["user"]["id"]
    return c
