"""
Service d'agent IA pédagogique (Claude / Anthropic).

Regroupe tout ce qui relève de l'intelligence artificielle de la plateforme :
génération de cours, génération de contrôles/quiz, et correction automatique
de copies d'élèves.
"""

import json
import re

import anthropic
from django.conf import settings


class AgentIAError(Exception):
    """Erreur levée quand l'agent IA ne peut pas répondre correctement."""


def _client():
    if not settings.ANTHROPIC_API_KEY:
        raise AgentIAError(
            "Aucune clé API Anthropic configurée. Ajoutez ANTHROPIC_API_KEY dans le fichier .env."
        )
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def _appeler_claude(system_prompt, user_prompt, max_tokens=4096):
    client = _client()
    try:
        message = client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except anthropic.APIError as exc:
        raise AgentIAError(f"Erreur lors de l'appel à l'agent IA : {exc}") from exc

    return "".join(block.text for block in message.content if block.type == "text")


def _extraire_json(texte):
    """Extrait un objet JSON depuis la réponse de Claude (avec ou sans balises markdown)."""
    match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", texte, re.DOTALL)
    brut = match.group(1) if match else texte.strip()
    try:
        return json.loads(brut)
    except json.JSONDecodeError as exc:
        raise AgentIAError("L'agent IA a renvoyé une réponse invalide. Merci de réessayer.") from exc


SYSTEME_PEDAGOGIE = (
    "Tu es un expert en pédagogie et en ingénierie de formation, avec une solide "
    "expérience dans la conception de cours, d'évaluations et de correction de copies "
    "pour le système éducatif francophone. Tes réponses sont toujours rigoureuses, "
    "structurées, adaptées au niveau demandé, et strictement au format JSON demandé "
    "sans aucun texte avant ou après le JSON."
)


def generer_cours(sujet, matiere, niveau, objectifs=""):
    """Génère un cours structuré (titre, introduction, sections, conclusion)."""
    prompt = f"""Rédige un cours complet et structuré sur le sujet suivant.

Matière : {matiere}
Niveau : {niveau}
Sujet : {sujet}
Objectifs pédagogiques : {objectifs or "à déduire du sujet et du niveau"}

Réponds UNIQUEMENT avec un objet JSON de cette forme exacte :
{{
  "titre": "titre du cours",
  "introduction": "paragraphe d'introduction qui contextualise le sujet",
  "sections": [
    {{"titre_section": "...", "contenu": "contenu détaillé en plusieurs paragraphes, en Markdown"}}
  ],
  "points_cles": ["point clé 1", "point clé 2", "..."],
  "conclusion": "paragraphe de conclusion",
  "duree_estimee_minutes": 45
}}

Le cours doit contenir entre 3 et 6 sections, avec des exemples concrets adaptés au niveau {niveau}.
"""
    reponse = _appeler_claude(SYSTEME_PEDAGOGIE, prompt, max_tokens=8000)
    return _extraire_json(reponse)


def generer_quiz(sujet, matiere, niveau, nb_questions=5, difficulte="moyen"):
    """Génère un contrôle / quiz à choix multiples avec réponses et explications."""
    prompt = f"""Crée un contrôle de type QCM sur le sujet suivant.

Matière : {matiere}
Niveau : {niveau}
Sujet : {sujet}
Nombre de questions : {nb_questions}
Difficulté : {difficulte}

Réponds UNIQUEMENT avec un objet JSON de cette forme exacte :
{{
  "titre": "titre du contrôle",
  "consigne": "consigne générale pour les élèves",
  "questions": [
    {{
      "enonce": "texte de la question",
      "choix": ["choix A", "choix B", "choix C", "choix D"],
      "index_bonne_reponse": 0,
      "explication": "explication pédagogique de la bonne réponse",
      "points": 2
    }}
  ]
}}

Chaque question doit avoir exactement 4 choix, un seul correct (index_bonne_reponse entre 0 et 3).
"""
    reponse = _appeler_claude(SYSTEME_PEDAGOGIE, prompt, max_tokens=8000)
    return _extraire_json(reponse)


def corriger_copie(enonce, bareme_points, reponse_eleve):
    """Corrige la copie d'un élève : note chiffrée + feedback détaillé et constructif."""
    prompt = f"""Corrige la copie d'un élève comme le ferait un professeur expérimenté,
bienveillant mais exigeant.

Énoncé du devoir : {enonce}
Barème total : {bareme_points} points
Réponse rendue par l'élève :
\"\"\"
{reponse_eleve}
\"\"\"

Réponds UNIQUEMENT avec un objet JSON de cette forme exacte :
{{
  "note": 14.5,
  "note_max": {bareme_points},
  "appreciation_generale": "2-3 phrases de synthèse",
  "points_forts": ["...", "..."],
  "points_a_ameliorer": ["...", "..."],
  "correction_detaillee": "correction point par point en Markdown, expliquant les erreurs et la démarche attendue"
}}
"""
    reponse = _appeler_claude(SYSTEME_PEDAGOGIE, prompt, max_tokens=6000)
    return _extraire_json(reponse)
