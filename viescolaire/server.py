"""Point d'entrée pour les hébergeurs (Render, Railway, Heroku…) : `gunicorn server:app`
lancé depuis le dossier viescolaire/. Le dépôt complet étant présent, on ajoute son dossier parent au chemin Python."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from viescolaire.app import app  # noqa: E402,F401
