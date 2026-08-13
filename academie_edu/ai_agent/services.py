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
    "Tu es un expert en pédagogie et en ingénierie de formation, spécialisé dans le "
    "système éducatif algérien. Tu connais précisément le programme scolaire officiel "
    "du Ministère de l'Éducation Nationale (MEN) algérien pour le primaire, le moyen "
    "(CEM) et le secondaire (lycée, toutes filières confondues). Pour chaque cours, "
    "contrôle ou correction, tu t'appuies strictement sur les notions, compétences et "
    "exigences du programme officiel algérien correspondant au cycle, à l'année et, le "
    "cas échéant, à la filière qui te sont indiqués — vocabulaire, exemples et niveau "
    "d'exigence inclus. Tes réponses sont toujours rigoureuses, structurées, et "
    "strictement au format JSON demandé sans aucun texte avant ou après le JSON."
)


def _contexte_niveau(cycle, annee, filiere=""):
    parts = [f"Cycle : {cycle}", f"Année : {annee}"]
    if filiere:
        parts.append(f"Filière : {filiere}")
    parts.append("Système éducatif : Algérie (programme national du Ministère de l'Éducation Nationale)")
    return "\n".join(parts)


def generer_cours(sujet, matiere, cycle, annee, filiere="", objectifs=""):
    """Génère un cours structuré (titre, introduction, sections, conclusion),
    conforme au programme national algérien du cycle/année/filière indiqués."""
    prompt = f"""Rédige un cours complet et structuré sur le sujet suivant, conforme au
programme national algérien.

{_contexte_niveau(cycle, annee, filiere)}
Matière : {matiere}
Sujet : {sujet}
Objectifs pédagogiques : {objectifs or "à déduire du sujet, de la matière et du niveau, selon le programme officiel algérien"}

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

Le cours doit contenir entre 3 et 6 sections, avec des exemples concrets adaptés au niveau
et respecter le vocabulaire et la progression du programme officiel algérien pour cette
matière et cette année.
"""
    reponse = _appeler_claude(SYSTEME_PEDAGOGIE, prompt, max_tokens=8000)
    return _extraire_json(reponse)


def generer_quiz(sujet, matiere, cycle, annee, filiere="", nb_questions=5, difficulte="moyen"):
    """Génère un contrôle / quiz à choix multiples avec réponses et explications,
    conforme au programme national algérien du cycle/année/filière indiqués."""
    prompt = f"""Crée un contrôle de type QCM sur le sujet suivant, conforme au programme
national algérien.

{_contexte_niveau(cycle, annee, filiere)}
Matière : {matiere}
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

Chaque question doit avoir exactement 4 choix, un seul correct (index_bonne_reponse entre
0 et 3), et respecter le niveau d'exigence du programme officiel algérien pour cette
matière et cette année.
"""
    reponse = _appeler_claude(SYSTEME_PEDAGOGIE, prompt, max_tokens=8000)
    return _extraire_json(reponse)


def corriger_copie(enonce, bareme_points, reponse_eleve, matiere="", cycle="", annee="", filiere=""):
    """Corrige la copie d'un élève : note chiffrée + feedback détaillé et constructif,
    évalué selon les exigences du programme national algérien du niveau concerné."""
    contexte = f"\n{_contexte_niveau(cycle, annee, filiere)}\nMatière : {matiere}\n" if cycle else ""
    prompt = f"""Corrige la copie d'un élève comme le ferait un professeur expérimenté,
bienveillant mais exigeant, selon les attendus du programme national algérien.
{contexte}
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
