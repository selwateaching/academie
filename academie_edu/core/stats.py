from datetime import timedelta

from django.utils import timezone

from accounts.models import Utilisateur
from bulletins.services import calculer_bulletin
from homework.models import Copie
from presence.models import Presence


def stats_professeur(user):
    """Agrège les statistiques d'un professeur sur toutes ses classes :
    moyennes des élèves (converties sur 20, convention algérienne),
    classement, répartition des notes et alertes."""
    classes = list(user.classes_enseignees.all())
    total_eleves = Utilisateur.objects.filter(classes_suivies__in=classes).distinct().count()
    copies_a_corriger = Copie.objects.filter(devoir__professeur=user, corrigee_par_ia=False).count()
    copies_a_valider = Copie.objects.filter(
        devoir__professeur=user, corrigee_par_ia=True, validee_par_professeur=False
    ).count()
    depuis_une_semaine = timezone.localdate() - timedelta(days=7)
    absences_semaine = Presence.objects.filter(
        seance__classe__in=classes, statut=Presence.Statut.ABSENT, seance__date__gte=depuis_une_semaine
    ).count()

    moyennes_par_eleve = {}
    for classe in classes:
        for eleve in classe.eleves.all():
            donnees = calculer_bulletin(classe, eleve)
            if donnees["moyenne_generale"] is not None:
                moyennes_par_eleve.setdefault(eleve, []).append(donnees["moyenne_generale"])

    classement = []
    repartition = {"moins_10": 0, "entre_10_12": 0, "entre_12_16": 0, "plus_16": 0}
    for eleve, valeurs in moyennes_par_eleve.items():
        moyenne_pct = sum(valeurs) / len(valeurs)
        moyenne_20 = round(moyenne_pct * 0.2, 1)
        classement.append({"eleve": eleve, "moyenne": moyenne_20})
        if moyenne_20 < 10:
            repartition["moins_10"] += 1
        elif moyenne_20 < 12:
            repartition["entre_10_12"] += 1
        elif moyenne_20 < 16:
            repartition["entre_12_16"] += 1
        else:
            repartition["plus_16"] += 1

    classement.sort(key=lambda ligne: ligne["moyenne"], reverse=True)
    total_notes = len(classement)
    moyenne_generale = round(sum(l["moyenne"] for l in classement) / total_notes, 1) if total_notes else None

    return {
        "nb_classes": len(classes),
        "nb_eleves": total_eleves,
        "copies_a_corriger": copies_a_corriger,
        "copies_a_valider": copies_a_valider,
        "absences_semaine": absences_semaine,
        "top_eleves": classement[:5],
        "eleves_en_difficulte": [l for l in classement if l["moyenne"] < 10][:5],
        "repartition": repartition,
        "total_notes": total_notes,
        "moyenne_generale": moyenne_generale,
    }


def roster_professeur(user):
    """Liste détaillée de tous les élèves du professeur, toutes classes confondues,
    avec leur moyenne (/20) et leurs absences/retards."""
    lignes = []
    for classe in user.classes_enseignees.all():
        for eleve in classe.eleves.all().order_by("last_name", "first_name"):
            donnees = calculer_bulletin(classe, eleve)
            moyenne = round(donnees["moyenne_generale"] * 0.2, 1) if donnees["moyenne_generale"] is not None else None
            absences = Presence.objects.filter(seance__classe=classe, eleve=eleve, statut=Presence.Statut.ABSENT).count()
            retards = Presence.objects.filter(seance__classe=classe, eleve=eleve, statut=Presence.Statut.RETARD).count()
            lignes.append({"eleve": eleve, "classe": classe, "moyenne": moyenne, "absences": absences, "retards": retards})
    return lignes
