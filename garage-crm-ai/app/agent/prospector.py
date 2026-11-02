"""Agent 1 – Prospecteur : trouve des entreprises via Google Places API (New).

Source officielle/autorisée, avec identifiant de lieu conservé pour la traçabilité.
Sans clé API, on utilise l'import CSV (voir main.py).
"""
import httpx

from ..config import get_settings
from .enrichment import commune_from_address
from .targets import CATEGORIES

PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
FIELDS = ",".join(
    "places." + f
    for f in ("id", "displayName", "formattedAddress", "nationalPhoneNumber",
              "websiteUri", "rating", "userRatingCount", "businessStatus")
)


class ProspectorError(Exception):
    pass


def search_places(category: str, city: str, limit: int = 20) -> list[dict]:
    s = get_settings()
    if not s.places_api_key:
        raise ProspectorError("GOOGLE_PLACES_API_KEY non configurée : utilisez l'import CSV ou ajoutez la clé.")
    if category not in CATEGORIES:
        raise ProspectorError(f"Catégorie inconnue : {category}")
    query = f"{CATEGORIES[category][1]} {city}"
    results: list[dict] = []
    page_token = None
    with httpx.Client(timeout=20) as client:
        while len(results) < limit:
            body = {"textQuery": query, "languageCode": "fr", "regionCode": "FR",
                    "pageSize": min(20, limit - len(results))}
            if page_token:
                body["pageToken"] = page_token
            r = client.post(PLACES_URL, json=body, headers={
                "X-Goog-Api-Key": s.places_api_key,
                "X-Goog-FieldMask": FIELDS + ",nextPageToken",
            })
            if r.status_code != 200:
                raise ProspectorError(f"Google Places a répondu {r.status_code} : {r.text[:200]}")
            data = r.json()
            for p in data.get("places", []):
                if p.get("businessStatus") not in (None, "OPERATIONAL"):
                    continue
                address = p.get("formattedAddress", "")
                results.append({
                    "name": p.get("displayName", {}).get("text", ""),
                    "address": address,
                    # vraie commune lue dans l'adresse ; sinon ce qui a été saisi
                    "city": commune_from_address(address) or city,
                    "phone": p.get("nationalPhoneNumber", ""),
                    "website": p.get("websiteUri", ""),
                    "rating": p.get("rating"),
                    "rating_count": p.get("userRatingCount"),
                    "category": category,
                    "source": "google_places",
                    "source_ref": "gp:" + p["id"],
                })
            page_token = data.get("nextPageToken")
            if not page_token:
                break
    return results[:limit]
