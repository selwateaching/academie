"""Accès OpenAI. Retourne None si pas de clé ou en cas d'erreur (les appelants ont un repli)."""
import json
import logging

from ..config import get_settings

log = logging.getLogger("garage.llm")


def chat_json(system: str, user: str) -> dict | None:
    s = get_settings()
    if not s.openai_api_key:
        return None
    try:
        from openai import OpenAI

        client = OpenAI(api_key=s.openai_api_key, timeout=30)
        resp = client.chat.completions.create(
            model=s.openai_model,
            response_format={"type": "json_object"},
            temperature=0.4,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as e:  # réseau, quota, JSON invalide...
        log.warning("Appel OpenAI échoué : %s", e)
        return None
