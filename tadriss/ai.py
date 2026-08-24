import json
import os
import re

import anthropic

MODEL_ID = os.environ.get("TADRISS_AI_MODEL", "claude-opus-5")

_client = None


def get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


TYPE_LABELS = {
    "sheet": "une fiche pédagogique complète (objectifs, prérequis, situation-problème, déroulement, activités, évaluation, remédiation)",
    "course": "un cours complet avec exemples et exercices corrigés",
    "assessment": "un contrôle noté sur 20 avec barème détaillé et corrigé",
    "quiz": "un quiz avec questions et corrigé",
    "progress": "une séquence de progression pédagogique",
    "week": "une préparation de semaine à partir d'un emploi du temps",
    "remediation": "des activités de remédiation ciblées pour élèves en difficulté",
    "analysis": "une analyse de classe avec recommandations pédagogiques",
    "journal": "un cahier journal détaillé",
}

LANG_INSTRUCTIONS = {
    "ar": "Rédige entièrement en arabe standard moderne. Le champ \"rtl\" doit être true.",
    "fr": "Rédige entièrement en français. Le champ \"rtl\" doit être false.",
    "en": "Rédige entièrement en anglais (English), avec un niveau adapté à des élèves algériens apprenant l'anglais comme langue étrangère. Le champ \"rtl\" doit être false.",
    "bi": "Rédige en français avec les termes clés traduits en arabe entre parenthèses. Le champ \"rtl\" doit être false.",
}
DEFAULT_LANG_INSTRUCTION = (
    "Choisis automatiquement la langue selon la matière : anglais si la matière est "
    "l'anglais, arabe standard moderne pour les matières arabophones du programme "
    "algérien, français sinon. Mets \"rtl\" à true uniquement si tu écris en arabe."
)

SYSTEM_PROMPT = (
    "Tu es TADRISS IA, un assistant pédagogique pour les enseignants du système "
    "scolaire algérien (primaire, moyen, secondaire). Tu réponds uniquement avec "
    "un objet JSON valide, sans aucun texte avant, après, ni de balises markdown "
    "autour du JSON."
)


def build_prompt(doc_type, level, subject, lang, user_prompt):
    label = TYPE_LABELS.get(doc_type, "un document pédagogique")
    lang_instruction = LANG_INSTRUCTIONS.get(lang, DEFAULT_LANG_INSTRUCTION)
    user_prompt = (user_prompt or "").strip() or "Prépare un document pédagogique complet."

    return f"""Génère {label}, conforme au programme officiel algérien.

Contexte :
- Niveau : {level or "non précisé"}
- Matière : {subject or "non précisée"}
- Consigne de l'enseignant : {user_prompt}

{lang_instruction}

Réponds STRICTEMENT avec un objet JSON valide, au format exact suivant, sans rien d'autre :
{{
  "title": "titre du document",
  "meta": "résumé court niveau/matière",
  "sections": [["Titre de section", "Contenu détaillé et concret"], ["Titre de section", "Contenu détaillé et concret"]],
  "rtl": true ou false
}}

Le document doit être complet, structuré, directement utilisable en classe, professionnel, sans superflu."""


def _extract_json(text):
    text = text.strip()
    text = re.sub(r"^```(json)?", "", text.strip()).strip()
    text = re.sub(r"```$", "", text.strip()).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Aucun JSON trouvé dans la réponse de l'IA")
    return json.loads(text[start : end + 1])


def fallback_content(doc_type, level, subject, user_prompt):
    """Repli local si l'IA est indisponible, pour que l'app reste opérationnelle."""
    sections = [
        ["Objectifs", "Comprendre la notion et la mobiliser dans des situations variées."],
        ["Prérequis", "Vérifier les connaissances nécessaires avant la séance."],
        ["Déroulement", "Mise en situation → recherche → mise en commun → application → évaluation."],
        ["Évaluation", "Questions courtes pour vérifier la compétence."],
    ]
    return {
        "title": TYPE_LABELS.get(doc_type, "Document pédagogique").capitalize(),
        "meta": f"{level} · {subject}",
        "prompt": user_prompt,
        "sections": sections,
        "rtl": False,
    }


def generate_document(doc_type, level, subject, lang, user_prompt):
    prompt = build_prompt(doc_type, level, subject, lang, user_prompt)
    try:
        client = get_client()
        response = client.messages.create(
            model=MODEL_ID,
            max_tokens=4000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        text = next((b.text for b in response.content if b.type == "text"), "")
        data = _extract_json(text)
        if not isinstance(data.get("sections"), list) or not data.get("title"):
            raise ValueError("Format de réponse IA invalide")
        data.setdefault("prompt", user_prompt)
        data.setdefault("rtl", False)
        return data
    except Exception as exc:  # noqa: BLE001 - l'app doit rester utilisable si l'IA tombe
        result = fallback_content(doc_type, level, subject, user_prompt)
        result["_ai_error"] = str(exc)
        return result
