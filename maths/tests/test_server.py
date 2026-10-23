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
        patcher = mock.patch.dict(os.environ, {"ABONNEMENTS_ACTIFS": "1", "ADMIN_EMAILS": ""})
        patcher.start()
        self.addCleanup(patcher.stop)
        self.app = server.create_app("sqlite://")
        self.c = self.app.test_client()

    def post(self, url, body=None, client=None):
        return (client or self.c).post(url, data=json.dumps(body or {}), headers={**H, "Content-Type": "application/json"})

    def register(self, email="a@b.dz", client=None):
        return self.post("/api/register", {"email": email, "password": "motdepasse1", "name": "Sara", "level": "cm1"}, client)


class OpenAccessTests(Base):
    def test_locked_by_default_when_flag_absent(self):
        env = {k: v for k, v in os.environ.items() if k != "ABONNEMENTS_ACTIFS"}
        with mock.patch.dict(os.environ, env, clear=True):
            self.register()
            self.assertFalse(self.c.get("/api/me").get_json()["config"]["open"])
            self.post("/api/demo-pick", {"skill": "6e-A1"})
            r = self.post("/api/progress", {"skills": {"6e-D1": {"score": 40}, "6e-A1": {"score": 40}}})
            self.assertEqual((r.get_json()["saved"], r.get_json()["refused"]), (1, ["6e-D1"]))

    def test_admin_sees_every_course_others_only_the_demo(self):
        with mock.patch.dict(os.environ, {"ADMIN_EMAILS": "patron@b.dz"}):
            self.register("patron@b.dz")
            self.assertTrue(self.c.get("/api/me").get_json()["config"]["open"])
            r = self.post("/api/progress", {"skills": {"6e-D1": {"score": 40}}})
            self.assertEqual(r.get_json()["refused"], [])
            other = self.app.test_client()
            self.register("client@b.dz", other)
            self.assertFalse(other.get("/api/me").get_json()["config"]["open"])
            r = self.post("/api/progress", {"skills": {"6e-D1": {"score": 40}}}, other)
            self.assertEqual(r.get_json()["refused"], ["6e-D1"])

    def test_everything_open_when_switched_off(self):
        with mock.patch.dict(os.environ, {"ABONNEMENTS_ACTIFS": "0"}):
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
        self.post("/api/demo-pick", {"skill": "cm1-A1"})
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
        self.post("/api/demo-pick", {"skill": "cm1-A1"})
        self.post("/api/progress", {"skills": {"cm1-A1": {"score": 9999, "answered": -3}}})
        s = self.c.get("/api/progress").get_json()["skills"]["cm1-A1"]
        self.assertEqual((s["score"], s["answered"]), (100, 0))

    def test_progress_needs_login(self):
        self.assertEqual(self.c.get("/api/progress").status_code, 401)

    def test_demo_picks(self):
        self.register()
        self.assertEqual(self.c.get("/api/me").get_json()["config"]["picks"], [])
        self.assertEqual(self.post("/api/progress", {"skills": {"cm1-A1": {"score": 5}}}).get_json()["refused"], ["cm1-A1"])
        for sid in ("cm1-A1", "cp-B2", "6e-C3"):
            self.assertEqual(self.post("/api/demo-pick", {"skill": sid}).status_code, 200)
        self.assertEqual(self.post("/api/demo-pick", {"skill": "cm1-A1"}).status_code, 200)
        self.assertEqual(self.post("/api/demo-pick", {"skill": "cm2-A1"}).status_code, 409)
        self.assertEqual(self.post("/api/demo-pick", {"skill": "zz"}).status_code, 400)
        self.assertEqual(self.c.get("/api/me").get_json()["config"]["picks"], ["cm1-A1", "cp-B2", "6e-C3"])
        r = self.post("/api/progress", {"skills": {"cp-B2": {"score": 5}, "cm1-D2": {"score": 5}}}).get_json()
        self.assertEqual((r["saved"], r["refused"]), (1, ["cm1-D2"]))

    def test_course_picks(self):
        self.assertEqual(self.post("/api/course-pick", {"course": "m5-relatifs"}).status_code, 401)
        self.register()
        cfg = self.c.get("/api/me").get_json()["config"]
        self.assertEqual((cfg["coursePicks"], cfg["courseMax"]), ([], 3))
        for cid in ("m5-relatifs", "p5-circuit", "c5-etats"):
            self.assertEqual(self.post("/api/course-pick", {"course": cid}).status_code, 200)
        self.assertEqual(self.post("/api/course-pick", {"course": "m5-relatifs"}).status_code, 200)
        self.assertEqual(self.post("/api/course-pick", {"course": "m5-fractions"}).status_code, 409)
        self.assertEqual(self.post("/api/course-pick", {"course": "pas un id"}).status_code, 400)
        cfg = self.c.get("/api/me").get_json()["config"]
        self.assertEqual(cfg["coursePicks"], ["m5-relatifs", "p5-circuit", "c5-etats"])
        self.assertEqual(cfg["picks"], [])  # les cours n'utilisent pas les 3 leçons gratuites
        self.assertEqual(self.post("/api/demo-pick", {"skill": "cm1-A1"}).status_code, 200)
        self.assertEqual(self.c.get("/api/me").get_json()["config"]["picks"], ["cm1-A1"])

    def test_profiles_have_separate_progress(self):
        self.register()
        self.post("/api/demo-pick", {"skill": "cm1-A1"})
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

    def test_lycee_plans(self):
        self.register()
        prices = self.c.get("/api/me").get_json()["config"]["prices"]
        self.assertEqual([prices[k] for k in ("2nde", "1re", "term")], [500, 500, 500])
        self.pay_demo("term")
        self.assertEqual(list(self.c.get("/api/me").get_json()["subscriptions"]), ["term"])

    def test_family_plan_unlocks_every_level(self):
        self.register()
        self.assertEqual(self.c.get("/api/me").get_json()["config"]["prices"]["fam"], 600)
        self.pay_demo("fam")
        self.assertEqual(list(self.c.get("/api/me").get_json()["subscriptions"]), ["fam"])
        ok = self.post("/api/progress", {"skills": {"cm1-D2": {"score": 10}, "cp-D2": {"score": 10}}}).get_json()
        self.assertEqual((ok["saved"], ok["refused"]), (2, []))

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


class AdminTests(Base):
    def setUp(self):
        super().setUp()
        p = mock.patch.dict(os.environ, {"ADMIN_EMAILS": "Patron@b.dz, autre@b.dz"})
        p.start()
        self.addCleanup(p.stop)

    def admin(self):
        self.register("patron@b.dz")  # e-mail enregistré en minuscules : la comparaison ignore la casse

    def client_id(self, email="client@b.dz"):
        other = self.app.test_client()
        self.register(email, other)
        with self.app.engine.begin() as conn:
            return conn.execute(select(db.users.c.id).where(db.users.c.email == email)).scalar()

    def test_admin_flag_and_refusals(self):
        self.assertEqual(self.c.get("/api/admin/stats").status_code, 403)  # anonyme
        self.register("simple@b.dz")
        self.assertFalse(self.c.get("/api/me").get_json()["user"]["admin"])
        for url in ("/api/admin/stats", "/api/admin/users", "/api/admin/users/1"):
            self.assertEqual(self.c.get(url).status_code, 403)
        self.assertEqual(self.post("/api/admin/users/1/subscription", {"plan": "cm1"}).status_code, 403)

    def test_admin_resets_course_picks(self):
        other = self.app.test_client()
        self.register("client@b.dz", other)
        self.post("/api/course-pick", {"course": "m5-relatifs"}, other)
        with self.app.engine.begin() as conn:
            uid = conn.execute(select(db.users.c.id).where(db.users.c.email == "client@b.dz")).scalar()
        self.admin()
        self.assertEqual(self.c.get(f"/api/admin/users/{uid}").get_json()["coursePicks"], ["m5-relatifs"])
        self.assertEqual(self.post(f"/api/admin/users/{uid}/picks", {"reset": True}).status_code, 200)
        self.assertEqual(self.c.get(f"/api/admin/users/{uid}").get_json()["coursePicks"], [])

    def test_no_admin_when_env_empty(self):
        with mock.patch.dict(os.environ, {"ADMIN_EMAILS": ""}):
            self.admin()
            self.assertFalse(self.c.get("/api/me").get_json()["user"]["admin"])
            self.assertEqual(self.c.get("/api/admin/stats").status_code, 403)

    def test_dashboard_grant_extend_remove(self):
        cid = self.client_id()
        self.admin()
        self.assertTrue(self.c.get("/api/me").get_json()["user"]["admin"])
        r = self.post(f"/api/admin/users/{cid}/subscription", {"plan": "fam", "days": 30, "amount": 600})
        self.assertEqual(r.status_code, 200)
        exp1 = r.get_json()["user"]["subscriptions"]["fam"]
        exp2 = self.post(f"/api/admin/users/{cid}/subscription", {"plan": "fam", "days": 15}).get_json()["user"]["subscriptions"]["fam"]
        self.assertGreater(exp2, exp1)
        stats = self.c.get("/api/admin/stats").get_json()
        self.assertEqual((stats["users"], stats["subscribers"], stats["revenue_month"]), (2, 1, 600))
        detail = self.c.get(f"/api/admin/users/{cid}").get_json()
        self.assertEqual((detail["payments"][0]["provider"], detail["payments"][0]["amount"]), ("manuel", 600))
        self.post(f"/api/admin/users/{cid}/subscription", {"plan": "fam", "remove": True})
        self.assertEqual(self.c.get("/api/admin/stats").get_json()["subscribers"], 0)

    def test_search_and_validation(self):
        cid = self.client_id("zoe@b.dz")
        self.client_id("paul@b.dz")
        self.admin()
        found = self.c.get("/api/admin/users?q=ZOE").get_json()["users"]
        self.assertEqual([u["email"] for u in found], ["zoe@b.dz"])
        self.assertEqual(self.c.get("/api/admin/users?q=%25").get_json()["users"], [])  # « % » n'est pas un joker
        bad = lambda body: self.post(f"/api/admin/users/{cid}/subscription", body).status_code
        self.assertEqual(bad({"plan": "terminale"}), 400)
        self.assertEqual(bad({"plan": "cm1", "days": 0}), 400)
        self.assertEqual(bad({"plan": "cm1", "days": "abc"}), 400)
        self.assertEqual(self.post("/api/admin/users/9999/subscription", {"plan": "cm1"}).status_code, 404)


class AdminResetTests(Base):
    def test_reset_password_for_admin_only(self):
        self.register("boss@b.dz")
        other = self.app.test_client()
        self.register("other@b.dz", other)
        with mock.patch.dict(os.environ, {"ADMIN_EMAILS": "boss@b.dz", "ADMIN_RESET_PASSWORD": "nouveau-mdp-1"}):
            server.reset_admin_password(self.app.engine)
        c = self.app.test_client()
        ok = c.post("/api/login", json={"email": "boss@b.dz", "password": "nouveau-mdp-1"}, headers=H)
        self.assertEqual(ok.status_code, 200)
        ko = c.post("/api/login", json={"email": "other@b.dz", "password": "nouveau-mdp-1"}, headers=H)
        self.assertEqual(ko.status_code, 401)


class ForgotTests(Base):
    def test_forgot_request_reaches_admin(self):
        with mock.patch.dict(os.environ, {"ADMIN_EMAILS": "boss@b.dz"}):
            self.register("boss@b.dz")
            cl = self.app.test_client()
            self.register("kid@b.dz", cl)
            anon = self.app.test_client()
            self.assertEqual(anon.post("/api/forgot", json={"email": "kid@b.dz"}, headers=H).status_code, 200)
            self.assertEqual(anon.post("/api/forgot", json={"email": "inconnu@b.dz"}, headers=H).status_code, 200)
            self.assertEqual(anon.post("/api/forgot", json={"email": "pas-un-mail"}, headers=H).status_code, 400)
            self.assertEqual(cl.get("/api/admin/requests").status_code, 403)
            reqs = self.c.get("/api/admin/requests").get_json()["requests"]
            self.assertEqual([r["email"] for r in reqs], ["kid@b.dz"])
            uid = self.c.get("/api/admin/users?q=kid").get_json()["users"][0]["id"]
            self.post(f"/api/admin/users/{uid}/password")
            self.assertEqual(self.c.get("/api/admin/requests").get_json()["requests"], [])


class AdminCreateTests(Base):
    def test_reset_creates_missing_admin_account(self):
        with mock.patch.dict(os.environ, {"ADMIN_EMAILS": "Boss@B.dz", "ADMIN_RESET_PASSWORD": "nouveau-mdp-1"}):
            server.reset_admin_password(self.app.engine)
            c = self.app.test_client()
            r = c.post("/api/login", json={"email": "boss@b.dz", "password": "nouveau-mdp-1"}, headers=H)
            self.assertEqual(r.status_code, 200)
            self.assertTrue(r.get_json()["user"]["admin"])


class AdminPasswordTests(Base):
    def test_admin_sets_temp_password(self):
        with mock.patch.dict(os.environ, {"ADMIN_EMAILS": "boss@b.dz"}):
            self.register("boss@b.dz")
            cl = self.app.test_client()
            self.register("kid@b.dz", cl)
            uid = self.c.get("/api/admin/users?q=kid").get_json()["users"][0]["id"]
            self.assertEqual(self.post(f"/api/admin/users/{uid}/password", client=cl).status_code, 403)
            pw = self.post(f"/api/admin/users/{uid}/password").get_json()["password"]
            self.assertGreaterEqual(len(pw), 8)
            r = self.app.test_client().post("/api/login", json={"email": "kid@b.dz", "password": pw}, headers=H)
            self.assertEqual(r.status_code, 200)


class LoginLimitTests(Base):
    def login(self, email, password, ip):
        return self.c.post("/api/login", data=json.dumps({"email": email, "password": password}),
                           headers={**H, "Content-Type": "application/json", "X-Forwarded-For": ip})

    def test_successful_logins_never_block(self):
        self.register("a@b.dz")
        for _ in range(15):
            self.assertEqual(self.login("a@b.dz", "motdepasse1", "1.2.3.4").status_code, 200)

    def test_wrong_password_is_limited_per_visitor(self):
        self.register("a@b.dz")
        codes = [self.login("a@b.dz", "faux", "1.2.3.4").status_code for _ in range(9)]
        self.assertEqual(codes[:8], [401] * 8)
        self.assertEqual(codes[8], 429)
        # un autre visiteur (autre adresse derrière le proxy) n'est pas touché
        self.assertEqual(self.login("a@b.dz", "motdepasse1", "5.6.7.8").status_code, 200)
