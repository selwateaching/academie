"""Client minimal pour Chargily Pay v2 (CIB et Edahabia).

À VÉRIFIER avec la documentation officielle et une clé de TEST avant toute mise en
production : adresses, noms des champs et signature des webhooks sont écrits d'après
la documentation publique de Chargily Pay v2, sans avoir pu l'appeler depuis ici.
Par prudence, le serveur ne se fie jamais au contenu d'un webhook : il redemande
l'état du paiement à Chargily (get_checkout) avant d'activer un abonnement.
"""
import hashlib
import hmac
import os

import requests

BASE = {
    "test": "https://pay.chargily.net/test/api/v2",
    "live": "https://pay.chargily.net/api/v2",
}


class ChargilyError(Exception):
    pass


def _base():
    mode = os.environ.get("CHARGILY_MODE", "test")
    return BASE["live" if mode == "live" else "test"]


def _headers():
    key = os.environ.get("CHARGILY_SECRET_KEY", "")
    if not key:
        raise ChargilyError("CHARGILY_SECRET_KEY manquante")
    return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def create_checkout(amount, success_url, failure_url, webhook_url, description, metadata, method=None):
    body = {
        "amount": int(amount),
        "currency": "dzd",
        "success_url": success_url,
        "failure_url": failure_url,
        "webhook_endpoint": webhook_url,
        "description": description,
        "locale": "fr",
        "metadata": metadata,
    }
    if method in ("cib", "edahabia"):
        body["payment_method"] = method
    r = requests.post(_base() + "/checkouts", json=body, headers=_headers(), timeout=15)
    if r.status_code >= 300:
        raise ChargilyError(f"Chargily a répondu {r.status_code}")
    data = r.json()
    return {"id": data["id"], "url": data["checkout_url"]}


def get_checkout(checkout_id):
    r = requests.get(f"{_base()}/checkouts/{checkout_id}", headers=_headers(), timeout=15)
    if r.status_code >= 300:
        raise ChargilyError(f"Chargily a répondu {r.status_code}")
    return r.json()


def valid_signature(raw_body, header_value):
    key = os.environ.get("CHARGILY_SECRET_KEY", "")
    if not key or not header_value:
        return False
    expected = hmac.new(key.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header_value.strip())
