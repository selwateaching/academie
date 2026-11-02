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


def _city_matches(city: str, result: dict) -> bool:
    c = _norm(city).strip()
    if not c:
        return True
    communes = {_norm(result.get("siege", {}).get("libelle_commune", ""))}
    for e in result.get("matching_etablissements", []) or []:
        communes.add(_norm(e.get("libelle_commune", "")))
    return any(c in x or x in c for x in communes if x.strip())


def _format_person(d: dict) -> str:
    prenoms = (d.get("prenoms") or "").split(",")[0].strip()
    nom = (d.get("nom") or "").strip()
    return f"{prenoms.title()} {nom.title()}".strip()


def pick_manager(results: list[dict], name: str, city: str) -> dict | None:
    """Choisit le dirigeant dans les résultats de l'API. Retourne {contact_name, qualite, siren, nom_complet}."""
    for r in results:
        if not _name_matches(name, r.get("nom_complet", "")) or not _city_matches(city, r):
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


def find_manager(name: str, city: str) -> dict | None:
    try:
        r = httpx.get(URL, params={"q": f"{name} {city}".strip(), "per_page": 5}, timeout=15)
        if r.status_code != 200:
            return None
        return pick_manager(r.json().get("results", []), name, city)
    except Exception:
        return None
