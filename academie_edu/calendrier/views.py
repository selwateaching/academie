import calendar as calendar_module
from datetime import date

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from accounts.decorators import role_required
from accounts.models import Utilisateur
from homework.models import Devoir

from .forms import EvenementForm
from .models import Evenement

MOIS_FR = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]


def _construire_grille(annee, mois, evenements_par_jour):
    cal = calendar_module.Calendar(firstweekday=0)
    semaines = []
    for semaine in cal.monthdatescalendar(annee, mois):
        jours = [
            {"date": jour, "dans_mois": jour.month == mois, "aujourdhui": jour == date.today(), "evenements": evenements_par_jour.get(jour, [])}
            for jour in semaine
        ]
        semaines.append(jours)
    return semaines


def _mois_cible(request):
    aujourdhui = date.today()
    annee = int(request.GET.get("annee", aujourdhui.year))
    mois = int(request.GET.get("mois", aujourdhui.month))
    if mois < 1:
        mois, annee = 12, annee - 1
    elif mois > 12:
        mois, annee = 1, annee + 1
    return annee, mois


def _evenements_par_jour(evenements, devoirs):
    par_jour = {}
    for e in evenements:
        par_jour.setdefault(e.date, []).append({"titre": e.titre, "type": e.get_type_display(), "id": e.id, "modifiable": True})
    for d in devoirs:
        if d.date_limite:
            jour = d.date_limite.date()
            par_jour.setdefault(jour, []).append({"titre": f"Devoir : {d.titre}", "type": "Devoir", "id": None, "modifiable": False})
    return par_jour


@role_required(Utilisateur.Role.PROFESSEUR)
def agenda_professeur(request):
    annee, mois = _mois_cible(request)
    evenements = Evenement.objects.filter(professeur=request.user)
    devoirs = Devoir.objects.filter(professeur=request.user, date_limite__year=annee, date_limite__month=mois)
    par_jour = _evenements_par_jour(evenements.filter(date__year=annee, date__month=mois), devoirs)

    aujourdhui = date.today()
    prochains = list(evenements.filter(date__gte=aujourdhui).order_by("date")[:6])

    return render(
        request,
        "calendrier/agenda_professeur.html",
        {
            "semaines": _construire_grille(annee, mois, par_jour),
            "mois_label": f"{MOIS_FR[mois - 1]} {annee}",
            "annee": annee,
            "mois": mois,
            "prochains": prochains,
        },
    )


@role_required(Utilisateur.Role.PROFESSEUR)
def creer_evenement(request):
    if request.method == "POST":
        form = EvenementForm(request.POST, professeur=request.user)
        if form.is_valid():
            evenement = form.save(commit=False)
            evenement.professeur = request.user
            evenement.save()
            messages.success(request, f"Événement « {evenement.titre} » ajouté.")
            return redirect("calendrier:agenda_professeur")
    else:
        form = EvenementForm(professeur=request.user, initial={"date": date.today()})
    return render(request, "calendrier/creer_evenement.html", {"form": form})


@role_required(Utilisateur.Role.PROFESSEUR)
def supprimer_evenement(request, pk):
    evenement = get_object_or_404(Evenement, pk=pk, professeur=request.user)
    evenement.delete()
    messages.success(request, "Événement supprimé.")
    return redirect("calendrier:agenda_professeur")


@login_required
def agenda_eleve(request):
    classes = request.user.classes_suivies.all()
    annee, mois = _mois_cible(request)
    evenements = Evenement.objects.filter(classe__in=classes)
    devoirs = Devoir.objects.filter(classe__in=classes, date_limite__year=annee, date_limite__month=mois)
    par_jour = _evenements_par_jour(evenements.filter(date__year=annee, date__month=mois), devoirs)

    aujourdhui = date.today()
    prochains = list(evenements.filter(date__gte=aujourdhui).order_by("date")[:6])

    return render(
        request,
        "calendrier/agenda_eleve.html",
        {
            "semaines": _construire_grille(annee, mois, par_jour),
            "mois_label": f"{MOIS_FR[mois - 1]} {annee}",
            "annee": annee,
            "mois": mois,
            "prochains": prochains,
        },
    )
