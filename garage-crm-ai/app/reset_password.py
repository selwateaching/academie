"""Réinitialise le mot de passe d'un utilisateur, sans toucher aux autres données.

Usage :  python -m app.reset_password admin@garage.local "NouveauMotDePasse"
Réservé à la personne qui a accès à l'ordinateur / au serveur de l'application.
"""
import sys

from sqlalchemy import select

from . import models
from .db import Base, SessionLocal, engine
from .security import hash_password


def reset(email: str, new_password: str) -> str:
    if len(new_password) < 8:
        return "ERREUR : le mot de passe doit faire au moins 8 caractères."
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        user = db.scalar(select(models.User).where(models.User.email == email.strip().lower()))
        if not user:
            known = ", ".join(u.email for u in db.scalars(select(models.User))) or "aucun"
            return f"ERREUR : aucun utilisateur « {email} ». Utilisateurs existants : {known}."
        user.password_hash = hash_password(new_password)
        user.active = True
        db.commit()
        return f"OK : le mot de passe de {user.email} est réinitialisé. Vous pouvez vous connecter."


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    msg = reset(sys.argv[1], sys.argv[2])
    print(msg)
    sys.exit(0 if msg.startswith("OK") else 1)
