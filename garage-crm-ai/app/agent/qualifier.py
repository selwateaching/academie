"""Agent 2 – Qualificateur : score 0-100 du potentiel pour un garage/carrosserie."""
from ..config import get_settings
from ..models import Company
from .llm import chat_json
from .targets import CATEGORIES

SYSTEM = (
    "Tu es responsable commercial d'un garage-carrosserie-mécanique. Tu évalues si une entreprise "
    "est un bon prospect B2B (flux régulier de réparations, flotte de véhicules, sous-traitance possible). "
    "Réponds en JSON : {\"score\": entier 0-100, \"reason\": une phrase en français, "
    "\"next_action\": une action concrète courte}. Ne devine pas de faits absents des données."
)


def heuristic_score(c: Company) -> tuple[int, str]:
    base = CATEGORIES.get(c.category, ("", "", 10, ""))[2]
    score, notes = 30 + base, [f"catégorie « {c.category or 'inconnue'} »"]
    if c.phone:
        score += 8; notes.append("téléphone connu")
    if c.website:
        score += 8; notes.append("site web")
    if c.email:
        score += 8; notes.append("email connu")
    if c.rating_count:
        bonus = min(12, c.rating_count // 20)
        score += bonus
        if bonus:
            notes.append(f"{c.rating_count} avis (entreprise active)")
    return min(score, 100), "Score par règles : " + ", ".join(notes)


def qualify(c: Company) -> tuple[int, str, str]:
    """Retourne (score, raison, prochaine action)."""
    s = get_settings()
    fiche = (f"Entreprise : {c.name}\nCatégorie : {c.category}\nVille : {c.city}\nSite : {c.website or '-'}\n"
             f"Téléphone : {c.phone or '-'}\nAvis : {c.rating or '-'} ({c.rating_count or 0})\n"
             f"Notre garage : {s.garage_name} à {s.garage_city}, services : {s.garage_services}")
    out = chat_json(SYSTEM, fiche)
    if out and isinstance(out.get("score"), (int, float)):
        score = max(0, min(100, int(out["score"])))
        return score, str(out.get("reason", ""))[:500], str(out.get("next_action", ""))[:300]
    score, reason = heuristic_score(c)
    action = "Appel téléphonique" if c.phone else ("Email de présentation" if c.email else "Compléter les coordonnées")
    return score, reason, action
