"""Enrichissement : retrouve le dirigeant d'une entreprise via l'API publique « Recherche d'entreprises »
(data.gouv.fr, gratuite, sans clé). Source : registre officiel des entreprises.

Prudence : on préfère ne rien renvoyer plutôt qu'un mauvais nom. Le résultat est à vérifier par l'humain.
"""
import re
import unicodedata

import httpx

URL = "https://recherche-entreprises.api.gouv.fr/search"
STOP = {"garage", "auto", "autos", "automobile", "automobiles", "location", "agence", "sarl", "sas", "sasu",
        "eurl", "societe", "ets", "the", "les", "des", "du", "de", "la", "le", "et", "centre", "groupe", "taxi", "taxis"}
PREFERRED = ("gérant", "gerant", "président", "president", "directeur général", "directeur general", "dirigeant")


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9 ]", " ", s)


def _tokens(s: str) -> set[str]:
    return {t for t in _norm(s).split() if len(t) > 2 and t not in STOP}


def _name_matches(wanted: str, found: str) -> bool:
    w, f = _tokens(wanted), _tokens(found)
    if not w:
        return False
    return len(w & f) / len(w) >= 0.5


def commune_from_address(address: str) -> str:
    """« 12 rue X, 31100 Toulouse, France » -> « Toulouse »."""
    m = re.search(r"\b\d{5}\s+([^,]+)", address or "")
    return m.group(1).strip() if m else ""


def _city_matches(city: str, result: dict, address: str = "") -> bool:
    c = _norm(city).strip()
    addr = _norm(address)
    if not c and not addr:
        return True
    places = [result.get("siege", {})] + list(result.get("matching_etablissements", []) or [])
    for e in places:
        commune = _norm(e.get("libelle_commune", "")).strip()
        cp = (e.get("code_postal") or "").strip()
        if commune and (commune in c or c in commune or (addr and commune in addr)):
            return True
        if cp and addr and cp in addr:
            return True
    return False


def _format_person(d: dict) -> str:
    prenoms = (d.get("prenoms") or "").split(",")[0].strip()
    nom = (d.get("nom") or "").strip()
    return f"{prenoms.title()} {nom.title()}".strip()


def pick_manager(results: list[dict], name: str, city: str, address: str = "") -> dict | None:
    """Choisit le dirigeant dans les résultats de l'API. Retourne {contact_name, qualite, siren, nom_complet}."""
    for r in results:
        if not _name_matches(name, r.get("nom_complet", "")) or not _city_matches(city, r, address):
            continue
        people = [d for d in r.get("dirigeants", []) or []
                  if "physique" in (d.get("type_dirigeant") or "").lower() and d.get("nom")]
        if not people:
            continue
        people.sort(key=lambda d: 0 if any(p in (d.get("qualite") or "").lower() for p in PREFERRED) else 1)
        d = people[0]
        return {"contact_name": _format_person(d), "qualite": d.get("qualite") or "",
                "siren": r.get("siren", ""), "nom_complet": r.get("nom_complet", "")}
    return None


def find_manager(name: str, city: str, address: str = "") -> dict | None:
    place = commune_from_address(address) or (city if not city.strip().isdigit() else "")
    try:
        r = httpx.get(URL, params={"q": f"{name} {place}".strip(), "per_page": 5}, timeout=15)
        if r.status_code != 200:
            return None
        return pick_manager(r.json().get("results", []), name, city, address)
    except Exception:
        return None
