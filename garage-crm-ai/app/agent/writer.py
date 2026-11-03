"""Agent 3 – Commercial : rédige emails, relances et scripts d'appel (toujours en brouillon)."""
import re
from pathlib import Path
from urllib.parse import quote

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


def google_reviews(kind: str) -> str:
    """Phrase sur la note Google du garage de mécanique, ou '' si les chiffres ne sont pas renseignés / invalides.

    kind : email | script | whatsapp. Jamais de chiffre inventé : tout vient de GARAGE_REVIEW_* dans .env."""
    s = get_settings()
    try:
        note = float(s.review_note.replace(",", "."))
        count = int(re.sub(r"\D", "", s.review_count) or 0)
    except ValueError:
        return ""
    if not (1 <= note <= 5) or count < 1:
        return ""
    n = f"{note:.1f}".replace(".", ",").replace(",0", "") if note != 5 else "5"
    url = s.review_url if s.review_url.startswith("https://") else ""
    if kind == "script":
        return (f"Notre garage de mécanique est noté {n} sur 5 sur Google, avec {count} avis. "
                "Les mêmes patrons viennent d'ouvrir une carrosserie, avec la même exigence de qualité.")
    base = f"Notre garage de mécanique est noté {n}/5 sur Google ({count} avis)" + (f" : {url}" if url else ".")
    return base + "\nLes mêmes patrons ont ouvert cette carrosserie, avec la même exigence de qualité."


def fill_reviews(text: str, kind: str) -> str:
    """Remplace {avis_google} par la phrase, ou supprime le paragraphe s'il n'y a rien à afficher."""
    line = google_reviews(kind)
    if line:
        return text.replace("{avis_google}", line)
    return re.sub(r"\{avis_google\}[ \t]*\n\s*\n", "", text).replace("{avis_google}", "").strip()


MODELE = Path(__file__).resolve().parent.parent / "modeles" / "email_premier_contact.txt"


def from_template(c: Company) -> tuple[str, str] | None:
    """Premier email = modèle du garage (fichier texte), texte repris tel quel.

    1re ligne : « Objet : … ». Seule la formule « Bonjour, » est personnalisée si le gérant est connu.
    Supprimez le fichier pour revenir à la rédaction par l'IA.
    """
    try:
        raw = MODELE.read_text(encoding="utf-8-sig").strip()
    except OSError:
        return None
    lines = raw.splitlines()
    if not lines or not lines[0].lower().startswith("objet"):
        return None
    subject = lines[0].split(":", 1)[1].strip()
    body = fill_reviews("\n".join(lines[1:]).strip(), "email")
    if body.startswith("Bonjour,"):
        body = greeting(c) + body[len("Bonjour,"):]
    return subject, body


WHATSAPP = Path(__file__).resolve().parent.parent / "modeles" / "whatsapp.txt"


def whatsapp_number(phone: str) -> str:
    """Numéro de MOBILE français au format international sans « + » (33612345678), sinon chaîne vide.

    Les fixes (01 à 05, 09) ne peuvent pas utiliser WhatsApp : aucun bouton n'est proposé."""
    d = re.sub(r"\D", "", phone or "")
    if d.startswith("00"):
        d = d[2:]
    if d.startswith("330"):
        d = "33" + d[3:]
    elif d.startswith("0") and len(d) == 10:
        d = "33" + d[1:]
    return d if re.fullmatch(r"33[67]\d{8}", d) else ""


def whatsapp_text(c: Company) -> str:
    try:
        text = WHATSAPP.read_text(encoding="utf-8-sig").strip()
    except OSError:
        s = get_settings()
        text = f"Bonjour,\n\nJe vous écris de la part de {s.garage_name} ({s.garage_city}). Seriez-vous disponible pour un court échange ?\n\nPour ne plus recevoir de message, répondez « STOP »."
    text = fill_reviews(text, "whatsapp")
    return greeting(c) + text[len("Bonjour,"):] if text.startswith("Bonjour,") else text


def whatsapp_url(c: Company) -> str:
    num = whatsapp_number(c.phone)
    return f"https://wa.me/{num}?text={quote(whatsapp_text(c))}" if num else ""


STOP_MODELE = Path(__file__).resolve().parent.parent / "modeles" / "confirmation_stop.txt"


def confirmation_stop(c: Company) -> tuple[str, str]:
    """Message envoyé UNE fois à un prospect qui demande à ne plus être contacté (aucun contenu commercial)."""
    s = get_settings()
    try:
        raw = STOP_MODELE.read_text(encoding="utf-8-sig").strip().splitlines()
        subject = raw[0].split(":", 1)[1].strip()
        body = "\n".join(raw[1:]).strip()
    except (OSError, IndexError):
        subject = "Votre demande est prise en compte"
        body = ("Bonjour,\n\nNous avons bien reçu votre demande : vous ne recevrez plus aucun message de notre part.\n"
                f"Nous vous prions de nous excuser pour le dérangement.\n\nCordialement,\n{s.garage_name}")
    if body.startswith("Bonjour,"):
        body = greeting(c) + body[len("Bonjour,"):]
    return subject, body


SCRIPT = Path(__file__).resolve().parent.parent / "modeles" / "script_appel.txt"


def script_from_template(c: Company) -> tuple[str, str] | None:
    """Script d'appel = modèle du garage (fichier texte), repris tel quel, précédé d'un rappel pour l'appelant."""
    try:
        text = SCRIPT.read_text(encoding="utf-8-sig").strip()
    except OSError:
        return None
    if not text:
        return None
    text = fill_reviews(text, "script")
    who = c.contact_name or "à identifier – demander le responsable ou le gérant"
    header = (f"À appeler : {c.name}" + (f" – {c.phone}" if c.phone else "") + f"\nInterlocuteur : {who}\n"
              + "—" * 20 + "\n\n")
    return f"Script d'appel – {c.name}", header + text


def draft(c: Company, kind: str = "email") -> tuple[str, str]:
    s = get_settings()
    kind = kind if kind in KINDS else "email"
    if kind in ("email", "script_appel"):
        tpl = from_template(c) if kind == "email" else script_from_template(c)
        if tpl:
            return tpl  # signature et mention STOP déjà dans le modèle
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
