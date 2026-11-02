"""Agent 3 – Commercial : rédige emails, relances et scripts d'appel (toujours en brouillon)."""
from ..config import get_settings
from ..models import Company
from .llm import chat_json
from .targets import CATEGORIES, label

SYSTEM = (
    "Tu rédiges des emails de prospection B2B en français pour un garage-carrosserie-mécanique. "
    "Ton professionnel, chaleureux, sans exagération, 90 à 140 mots, un seul appel à l'action. "
    "N'invente aucun chiffre, aucune référence client ni aucun fait sur le destinataire. "
    "Réponds en JSON : {\"subject\": \"...\", \"body\": \"...\"} (body sans signature ni mention de désinscription)."
)

KINDS = {
    "email": "Premier email de présentation.",
    "relance": "Relance courte et aimable d'un premier email resté sans réponse.",
    "script_appel": "Script d'appel téléphonique de 30 secondes avec accroche, question ouverte et proposition de rendez-vous.",
}


def signature() -> str:
    s = get_settings()
    return f"\n\nCordialement,\n{s.garage_name}\n{s.garage_city}" + (f"\nTél. : {s.garage_phone}" if s.garage_phone else "")


def optout() -> str:
    return ("\n\n—\nVous recevez ce message à titre professionnel. Pour ne plus être contacté, "
            "répondez simplement « STOP » : votre demande sera prise en compte immédiatement.")


def greeting(c: Company) -> str:
    # Nom complet sans « Madame/Monsieur » : on ne devine pas le genre
    return f"Bonjour {c.contact_name}," if c.contact_name else "Bonjour,"


def _fallback(c: Company, kind: str) -> tuple[str, str]:
    s = get_settings()
    hook = CATEGORIES.get(c.category, ("", "", 0, "un entretien et des réparations rapides pour vos véhicules"))[3]
    if kind == "script_appel":
        return (f"Script d'appel – {c.name}",
                f"« Bonjour, {s.garage_name} à {s.garage_city}. Nous travaillons avec des {label(c.category).lower()} "
                f"pour {hook}. Qui s'occupe de l'entretien et des réparations de vos véhicules ? "
                f"Je peux passer 15 minutes vous présenter notre offre cette semaine ? »")
    if kind == "relance":
        return (f"Re : collaboration {s.garage_name}",
                f"{greeting(c)}\n\nJe me permets de revenir vers vous suite à mon précédent message. "
                f"Seriez-vous disponible 15 minutes cette semaine pour échanger sur vos besoins en carrosserie et mécanique ?")
    return (f"{s.garage_name} – carrosserie et mécanique pour {c.name}",
            f"{greeting(c)}\n\nNous sommes {s.garage_name}, garage-carrosserie à {s.garage_city} ({s.garage_services}). "
            f"Nous accompagnons les professionnels comme {c.name} : {hook}.\n\n"
            f"Pourrions-nous convenir de 15 minutes cette semaine pour vous présenter notre offre ?")


def draft(c: Company, kind: str = "email") -> tuple[str, str]:
    s = get_settings()
    kind = kind if kind in KINDS else "email"
    hook = CATEGORIES.get(c.category, ("", "", 0, ""))[3]
    prompt = (f"{KINDS[kind]}\nDestinataire : {c.name} ({label(c.category)}, {c.city}). Site : {c.website or '-'}\n"
              f"Interlocuteur : {c.contact_name or 'inconnu (commence par « Bonjour, »)'}"
              f"{' (commence par « Bonjour ' + c.contact_name + ', » sans Madame ni Monsieur)' if c.contact_name else ''}\n"
              f"Argument pertinent : {hook}\nExpéditeur : {s.garage_name} à {s.garage_city}. Services : {s.garage_services}.")
    out = chat_json(SYSTEM, prompt)
    if out and out.get("subject") and out.get("body"):
        subject, body = str(out["subject"]), str(out["body"])
    else:
        subject, body = _fallback(c, kind)
    if kind != "script_appel":
        body += signature() + optout()
    return subject, body
