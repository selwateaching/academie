"""Journal d'audit générique : consigne qui a fait quoi et quand sur
chaque type d'enregistrement (client, véhicule, dossier, devis, facture,
assureur, catalogue). L'écriture est ajoutée à la session sans commit —
elle fait partie de la même transaction que l'action journalisée."""

from flask_login import current_user

from extensions import db
from models import Historique


def log(entity_type, entity_id, action, details=""):
    try:
        user_name = current_user.name if current_user.is_authenticated else "Système"
    except Exception:
        user_name = "Système"
    db.session.add(
        Historique(
            entity_type=entity_type,
            entity_id=entity_id,
            user_name=user_name,
            action=action,
            details=details or "",
        )
    )


def for_entity(entity_type, entity_id):
    return (
        Historique.query.filter_by(entity_type=entity_type, entity_id=entity_id)
        .order_by(Historique.created_at.desc())
        .all()
    )
