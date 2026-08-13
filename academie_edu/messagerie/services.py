from accounts.models import Utilisateur


def contacts_disponibles(user):
    """Retourne un dict {libellé_groupe: queryset_utilisateurs} des personnes
    avec qui `user` peut démarrer une conversation, selon son rôle."""
    if user.role == Utilisateur.Role.PROFESSEUR:
        classes = user.classes_enseignees.all()
        eleves = Utilisateur.objects.filter(classes_suivies__in=classes).distinct()
        collegues = Utilisateur.objects.filter(role=Utilisateur.Role.PROFESSEUR).exclude(pk=user.pk)
        parents = Utilisateur.objects.filter(liens_enfants__eleve__in=eleves).distinct()
        return {"Collègues": collegues, "Élèves": eleves, "Parents": parents}

    if user.role == Utilisateur.Role.ELEVE:
        classes = user.classes_suivies.all()
        profs = Utilisateur.objects.filter(classes_enseignees__in=classes).distinct()
        return {"Professeurs": profs}

    if user.role == Utilisateur.Role.PARENT:
        enfants = user.enfants.all()
        profs = Utilisateur.objects.filter(classes_enseignees__eleves__in=enfants).distinct()
        return {"Professeurs": profs}

    return {}


def contact_autorise(user, contact):
    for groupe in contacts_disponibles(user).values():
        if groupe.filter(pk=contact.pk).exists():
            return True
    return False
