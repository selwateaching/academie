"""Agent 1 – Prospecteur : trouve des entreprises via Google Places API (New).

La recherche est VERROUILLÉE sur une zone : la ville demandée est d'abord localisée, la recherche est restreinte
à un carré autour d'elle, puis tout résultat situé à plus de `radius_km` est écarté. Aucun prospect hors zone.
"""
import math

import httpx

from ..config import get_settings
from .enrichment import commune_from_address
from .targets import CATEGORIES, is_competitor

PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
FIELDS = ",".join(
    "places." + f
    for f in ("id", "displayName", "formattedAddress", "nationalPhoneNumber",
              "websiteUri", "rating", "userRatingCount", "businessStatus", "location")
)


class ProspectorError(Exception):
    pass


class PlaceList(list):
    """Liste de résultats avec le nombre de résultats écartés car hors zone."""
    dropped = 0
    competitors = 0
    zone = ""


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(a))


def _default_post(url: str, body: dict, headers: dict) -> tuple[int, dict, str]:
    with httpx.Client(timeout=20) as client:
        r = client.post(url, json=body, headers=headers)
        try:
            data = r.json()
        except ValueError:
            data = {}
        return r.status_code, data, r.text[:200]


def locate(city: str, key: str, post) -> tuple[float, float]:
    """Coordonnées du centre de la ville demandée."""
    status, data, raw = post(PLACES_URL, {"textQuery": f"{city}, France", "languageCode": "fr", "regionCode": "FR", "pageSize": 1},
                             {"X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.location,places.formattedAddress"})
    if status != 200:
        raise ProspectorError(f"Google Places a répondu {status} : {raw}")
    places = data.get("places") or []
    loc = places[0].get("location") if places else None
    if not loc:
        raise ProspectorError(f"Ville introuvable : « {city} ». Indiquez le nom d'une commune (ex. Toulouse).")
    return loc["latitude"], loc["longitude"]


def search_places(category: str, city: str, limit: int = 20, radius_km: int = 15, post=None) -> list[dict]:
    s = get_settings()
    if not s.places_api_key:
        raise ProspectorError("GOOGLE_PLACES_API_KEY non configurée : utilisez l'import CSV ou ajoutez la clé.")
    if category not in CATEGORIES:
        raise ProspectorError(f"Catégorie inconnue : {category}")
    city = (city or "").strip()
    if not city or city.isdigit():
        raise ProspectorError("Indiquez le nom d'une ville (ex. Toulouse), pas un numéro de département ni un champ vide.")
    radius_km = max(2, min(int(radius_km), 60))
    post = post or _default_post
    lat, lng = locate(city, s.places_api_key, post)
    dlat = radius_km / 111.0
    dlng = radius_km / (111.0 * max(math.cos(math.radians(lat)), 0.2))
    zone = {"rectangle": {"low": {"latitude": lat - dlat, "longitude": lng - dlng},
                          "high": {"latitude": lat + dlat, "longitude": lng + dlng}}}
    results = PlaceList()
    results.zone = f"{city}, rayon {radius_km} km"
    page_token = None
    pages = 0
    while len(results) < limit and pages < 5:
        pages += 1
        body = {"textQuery": f"{CATEGORIES[category][1]} {city}", "languageCode": "fr", "regionCode": "FR",
                "pageSize": min(20, limit - len(results) + 5), "locationRestriction": zone}
        if page_token:
            body["pageToken"] = page_token
        status, data, raw = post(PLACES_URL, body, {"X-Goog-Api-Key": s.places_api_key, "X-Goog-FieldMask": FIELDS + ",nextPageToken"})
        if status != 200:
            raise ProspectorError(f"Google Places a répondu {status} : {raw}")
        for p in data.get("places", []):
            if p.get("businessStatus") not in (None, "OPERATIONAL"):
                continue
            if is_competitor(p.get("displayName", {}).get("text", "")):
                results.competitors += 1                  # une autre carrosserie : concurrent, jamais proposé
                continue
            loc = p.get("location")
            if not loc or distance_km(lat, lng, loc["latitude"], loc["longitude"]) > radius_km * 1.15:
                results.dropped += 1                      # hors zone : jamais enregistré
                continue
            address = p.get("formattedAddress", "")
            results.append({
                "name": p.get("displayName", {}).get("text", ""),
                "address": address,
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
    out = PlaceList(results[:limit])
    out.dropped, out.zone, out.competitors = results.dropped, results.zone, results.competitors
    return out
