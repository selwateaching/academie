"""Moteur de recherche de l'assistant d'aide : correspondance de mots-clés
simple (sans IA/API externe), insensible aux accents et à la casse."""

import re
import unicodedata

MOTS_VIDES = {
    "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "a", "au",
    "aux", "ce", "ces", "cet", "cette", "je", "tu", "il", "elle", "on", "nous",
    "vous", "ils", "elles", "est", "sont", "comment", "pourquoi", "quand",
    "quel", "quelle", "quels", "quelles", "que", "qui", "dans", "pour", "avec",
    "sur", "mon", "ma", "mes", "son", "sa", "ses", "pas", "ne", "se", "d", "l",
    "sans", "plus", "bien", "peut", "peuvent", "tout", "toute", "tous",
    "toutes", "meme", "fait", "faut", "faire", "cela", "ca", "y", "en", "si",
}


def _normaliser(texte):
    texte = texte.lower()
    texte = unicodedata.normalize("NFKD", texte)
    texte = "".join(c for c in texte if not unicodedata.combining(c))
    return texte


def _mots(texte):
    texte = _normaliser(texte)
    mots = re.findall(r"[a-z0-9]+", texte)
    return [m for m in mots if m not in MOTS_VIDES and len(m) > 1]


def rechercher(requete, faqs, limite=3):
    """Retourne les FAQ les mieux notées pour la requête, triées par score
    décroissant. Une FAQ ne ressort que si au moins un mot correspond."""
    mots_requete = set(_mots(requete))
    if not mots_requete:
        return []

    resultats = []
    for faq in faqs:
        texte_cible = f"{faq.question} {faq.mots_cles} {faq.reponse}"
        mots_cible = set(_mots(texte_cible))
        score = len(mots_requete & mots_cible)
        # bonus si un mot de la requête apparaît tel quel dans la question
        question_normalisee = _normaliser(faq.question)
        for mot in mots_requete:
            if mot in question_normalisee:
                score += 1
        if score > 0:
            resultats.append((score, faq))

    resultats.sort(key=lambda x: x[0], reverse=True)
    return [faq for _score, faq in resultats[:limite]]
