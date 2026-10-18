"""Tests du serveur : python3 -m unittest discover -s tests  (depuis le dossier maths/)."""
import hashlib
import hmac
import json
import os
import sys
import unittest
from datetime import timedelta
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ["PAYMENT_MODE"] = "demo"

import server  # noqa: E402
import store as db  # noqa: E402
from sqlalchemy import select  # noqa: E402

H = {"X-Tadriss": "1"}


class Base(unittest.TestCase):
    def setUp(self):
        patcher = mock.patch.dict(os.environ, {"ABONNEMENTS_ACTIFS": "1"})
        patcher.start()
        self.addCleanup(patcher.stop)
        self.app = server.create_app("sqlite://")
        self.c = self.app.test_client()

    def post(self, url, body=None, client=None):
        return (client or self.c).post(url, data=json.dumps(body or {}), headers={**H, "Content-Type": "application/json"})

    def register(self, email="a@b.dz", client=None):
        return self.post("/api/register", {"email": email, "password": "motdepasse1", "name": "Sara", "level": "cm1"}, client)


class OpenAccessTests(Base):
    def test_everything_open_without_flag(self):
        with mock.patch.dict(os.environ, {"ABONNEMENTS_ACTIFS": ""}):
            self.register()
            self.assertTrue(self.c.get("/api/me").get_json()["config"]["open"])
            r = self.post("/api/progress", {"skills": {"6e-D1": {"score": 40, "answered": 5, "correct": 3}}})
            self.assertEqual(r.get_json()["refused"], [])

    def test_locked_when_flag_on(self):
        self.register()
        self.assertFalse(self.c.get("/api/me").get_json()["config"]["open"])
        r = self.post("/api/progress", {"skills": {"6e-D1": {"score": 40, "answered": 5, "correct": 3}}})
        self.assertEqual(r.get_json()["refused"], ["6e-D1"])


class AuthTests(Base):
    def test_register_login_logout(self):
        r = self.register()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["user"]["email"], "a@b.dz")
        self.assertEqual(len(r.get_json()["profiles"]), 1)
        self.post("/api/logout")
        self.assertIsNone(self.c.get("/api/me").get_json()["user"])
        self.assertEqual(self.post("/api/login", {"email": "a@b.dz", "password": "faux"}).status_code, 401)
        self.assertEqual(self.post("/api/login", {"email": "A@B.dz", "password": "motdepasse1"}).status_code, 200)

    def test_validation_and_duplicates(self):
        self.assertEqual(self.post("/api/register", {"email": "x", "password": "motdepasse1", "name": "S"}).status_code, 400)
        self.assertEqual(self.post("/api/register", {"email": "x@y.dz", "password": "court", "name": "S"}).status_code, 400)
        self.assertEqual(self.register().status_code, 200)
        self.assertEqual(self.register().status_code, 409)

    def test_csrf_header_required(self):
        r = self.c.post("/api/login", data="{}", headers={"Content-Type": "application/json"})
        self.assertEqual(r.status_code, 403)

    def test_profiles(self):
        self.register()
        r = self.post("/api/profiles", {"name": "Yacine", "level": "6e"})
        self.assertEqual(len(r.get_json()["profiles"]), 2)
        first = r.get_json()["profiles"][0]["id"]
        self.assertEqual(self.post(f"/api/profiles/{first}/select").get_json()["activeProfile"], first)
        d = self.c.delete(f"/api/profiles/{first}", headers=H)
        self.assertEqual(len(d.get_json()["profiles"]), 1)
        last = d.get_json()["profiles"][0]["id"]
        self.assertEqual(self.c.delete(f"/api/profiles/{last}", headers=H).status_code, 400)

    def test_cannot_touch_other_users_profile(self):
        self.register()
        other = self.app.test_client()
        self.register("z@b.dz", other)
        pid = self.c.get("/api/me").get_json()["profiles"][0]["id"]
        self.assertEqual(self.post(f"/api/profiles/{pid}/select", client=other).status_code, 404)
        self.assertEqual(other.delete(f"/api/profiles/{pid}", headers=H).status_code, 404)


class ProgressAndAccessTests(Base):
    def test_free_vs_paid_progress(self):
        self.register()
        body = {"skills": {"cm1-A1": {"score": 40, "answered": 5, "correct": 4, "secs": 30, "last": 1},
                           "cm1-D2": {"score": 90, "answered": 9, "correct": 9, "secs": 30, "last": 1},
                           "bad": {"score": 1}},
                "days": {"2026-10-18": {"n": 5, "ok": 4, "secs": 30}, "nope": {"n": 1}}}
        r = self.post("/api/progress", body).get_json()
        self.assertEqual(r["saved"], 1)
        self.assertEqual(r["refused"], ["cm1-D2"])
        got = self.c.get("/api/progress").get_json()
        self.assertEqual(list(got["skills"]), ["cm1-A1"])
        self.assertEqual(got["days"]["2026-10-18"]["n"], 5)

    def test_score_clamped(self):
        self.register()
        self.post("/api/progress", {"skills": {"cm1-A1": {"score": 9999, "answered": -3}}})
        s = self.c.get("/api/progress").get_json()["skills"]["cm1-A1"]
        self.assertEqual((s["score"], s["answered"]), (100, 0))

    def test_progress_needs_login(self):
        self.assertEqual(self.c.get("/api/progress").status_code, 401)

    def test_profiles_have_separate_progress(self):
        self.register()
        self.post("/api/progress", {"skills": {"cm1-A1": {"score": 50}}})
        self.post("/api/profiles", {"name": "Yacine", "level": "cm1"})
        self.assertEqual(self.c.get("/api/progress").get_json()["skills"], {})


class PaymentTests(Base):
    def pay_demo(self, level="cm1"):
        url = self.post("/api/checkout", {"level": level}).get_json()["url"]
        cid = url.rsplit("/", 1)[1]
        self.assertEqual(self.c.get(f"/pay/demo/{cid}").status_code, 200)
        r = self.c.post(f"/pay/demo/{cid}/confirm")
        self.assertEqual(r.status_code, 303)
        return cid

    def test_prices(self):
        cfg = self.c.get("/api/me").get_json()["config"]
        self.assertEqual(cfg["prices"]["6e"], 400)
        for lv in ("gs", "cp", "ce1", "ce2", "cm1", "cm2"):
            self.assertEqual(cfg["prices"][lv], 200)

    def test_demo_payment_unlocks_level_only(self):
        self.register()
        self.pay_demo("cm1")
        me = self.c.get("/api/me").get_json()
        self.assertEqual(list(me["subscriptions"]), ["cm1"])
        ok = self.post("/api/progress", {"skills": {"cm1-D2": {"score": 10}, "cp-D2": {"score": 10}}}).get_json()
        self.assertEqual((ok["saved"], ok["refused"]), (1, ["cp-D2"]))

    def test_payment_is_idempotent_and_extends(self):
        self.register()
        self.pay_demo("6e")
        exp1 = self.c.get("/api/me").get_json()["subscriptions"]["6e"]
        self.pay_demo("6e")
        exp2 = self.c.get("/api/me").get_json()["subscriptions"]["6e"]
        self.assertGreater(exp2, exp1)
        with self.app.engine.begin() as conn:
            pid = conn.execute(select(db.payments.c.id)).first()[0]
            self.assertFalse(db.activate_payment(conn, pid))  # déjà payé : rien ne change

    def test_expired_subscription_gives_no_access(self):
        self.register()
        self.pay_demo("cm1")
        with self.app.engine.begin() as conn:
            conn.execute(db.subscriptions.update().values(expires_at=db.now() - timedelta(days=1)))
        self.assertEqual(self.c.get("/api/me").get_json()["subscriptions"], {})
        self.assertEqual(self.post("/api/progress", {"skills": {"cm1-D2": {"score": 10}}}).get_json()["refused"], ["cm1-D2"])

    def test_other_user_cannot_confirm_demo_payment(self):
        self.register()
        url = self.post("/api/checkout", {"level": "cm1"}).get_json()["url"]
        cid = url.rsplit("/", 1)[1]
        other = self.app.test_client()
        self.register("z@b.dz", other)
        self.assertEqual(other.post(f"/pay/demo/{cid}/confirm").status_code, 403)
        self.assertEqual(self.c.get("/api/me").get_json()["subscriptions"], {})

    def test_checkout_needs_login_and_valid_level(self):
        self.assertEqual(self.post("/api/checkout", {"level": "cm1"}).status_code, 401)
        self.register()
        self.assertEqual(self.post("/api/checkout", {"level": "terminale"}).status_code, 400)

    def test_demo_page_disabled_in_chargily_mode(self):
        self.register()
        url = self.post("/api/checkout", {"level": "cm1"}).get_json()["url"]
        cid = url.rsplit("/", 1)[1]
        with mock.patch.dict(os.environ, {"PAYMENT_MODE": "chargily"}):
            self.assertEqual(self.c.get(f"/pay/demo/{cid}").status_code, 404)
            self.assertEqual(self.c.post(f"/pay/demo/{cid}/confirm").status_code, 404)


class ChargilyTests(Base):
    ENV = {"PAYMENT_MODE": "chargily", "CHARGILY_SECRET_KEY": "test_sk_fake", "CHARGILY_MODE": "test",
           "BASE_URL": "https://exemple.test"}

    def test_checkout_calls_chargily_in_test_mode(self):
        self.register()
        with mock.patch.dict(os.environ, self.ENV), mock.patch("server.chargily.requests.post") as post:
            post.return_value = mock.Mock(status_code=200, json=lambda: {"id": "ch_1", "checkout_url": "https://pay.example/ch_1"})
            r = self.post("/api/checkout", {"level": "6e", "method": "edahabia"})
        self.assertEqual(r.get_json()["url"], "https://pay.example/ch_1")
        args, kwargs = post.call_args
        self.assertEqual(args[0], "https://pay.chargily.net/test/api/v2/checkouts")
        self.assertEqual(kwargs["json"]["amount"], 400)
        self.assertEqual(kwargs["json"]["currency"], "dzd")
        self.assertEqual(kwargs["json"]["payment_method"], "edahabia")

    def webhook(self, body, key="test_sk_fake", sign=True):
        raw = json.dumps(body).encode()
        sig = hmac.new(key.encode(), raw, hashlib.sha256).hexdigest() if sign else "x"
        return self.c.post("/api/webhook/chargily", data=raw, headers={"signature": sig, "Content-Type": "application/json"})

    def test_webhook_rejects_bad_signature(self):
        with mock.patch.dict(os.environ, self.ENV):
            self.assertEqual(self.webhook({"data": {"id": "ch_1"}}, sign=False).status_code, 403)
            self.assertEqual(self.webhook({"data": {"id": "ch_1"}}, key="autre").status_code, 403)

    def test_webhook_activates_only_if_provider_confirms(self):
        self.register()
        with mock.patch.dict(os.environ, self.ENV), mock.patch("server.chargily.requests.post") as post:
            post.return_value = mock.Mock(status_code=200, json=lambda: {"id": "ch_1", "checkout_url": "u"})
            self.post("/api/checkout", {"level": "cm1"})
        with mock.patch.dict(os.environ, self.ENV), mock.patch("server.chargily.requests.get") as get:
            get.return_value = mock.Mock(status_code=200, json=lambda: {"status": "pending"})
            self.assertEqual(self.webhook({"type": "checkout.paid", "data": {"id": "ch_1"}}).status_code, 200)
            self.assertEqual(self.c.get("/api/me").get_json()["subscriptions"], {})
            get.return_value = mock.Mock(status_code=200, json=lambda: {"status": "paid"})
            self.webhook({"type": "checkout.paid", "data": {"id": "ch_1"}})
            self.assertEqual(list(self.c.get("/api/me").get_json()["subscriptions"]), ["cm1"])
            self.webhook({"type": "checkout.paid", "data": {"id": "ch_1"}})  # rejoué : une seule prolongation
        with self.app.engine.begin() as conn:
            exp = conn.execute(select(db.subscriptions.c.expires_at)).first()[0]
        self.assertLess(exp, db.now() + timedelta(days=31))


class StaticTests(Base):
    def test_static_and_health(self):
        self.assertEqual(self.c.get("/healthz").data, b"ok")
        self.assertEqual(self.c.get("/").status_code, 200)
        self.assertEqual(self.c.get("/js/app.js").status_code, 200)
        self.assertEqual(self.c.get("/server.py").status_code, 404)
        self.assertEqual(self.c.get("/js/../server.py").status_code, 404)


if __name__ == "__main__":
    unittest.main()
