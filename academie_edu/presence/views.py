from datetime import date as date_cls

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from academics.models import Classe
from accounts.decorators import role_required
from accounts.models import LienParentEleve, Utilisateur

from .models import Presence, Seance


@role_required(Utilisateur.Role.PROFESSEUR)
def choisir_classe(request):
    classes = Classe.objects.filter(professeur=request.user)
    return render(request, "presence/choisir_classe.html", {"classes": classes})


def _parse_date(valeur):
    if not valeur:
        return timezone.localdate()
    try:
        return date_cls.fromisoformat(valeur)
    except ValueError:
        return timezone.localdate()


@role_required(Utilisateur.Role.PROFESSEUR)
def faire_appel(request, classe_id):
    classe = get_object_or_404(Classe, pk=classe_id, professeur=request.user)
    jour = _parse_date(request.GET.get("date") or request.POST.get("date"))
    eleves = classe.eleves.all().order_by("last_name", "first_name")

    if request.method == "POST":
        seance, _ = Seance.objects.get_or_create(classe=classe, date=jour, defaults={"professeur": request.user})
        for eleve in eleves:
            statut = request.POST.get(f"statut_{eleve.pk}", Presence.Statut.PRESENT)
            if statut not in Presence.Statut.values:
                statut = Presence.Statut.PRESENT
            Presence.objects.update_or_create(seance=seance, eleve=eleve, defaults={"statut": statut})
        messages.success(request, f"Appel enregistré pour le {jour.strftime('%d/%m/%Y')}.")
        return redirect("presence:faire_appel", classe_id=classe.pk)

    seance_existante = Seance.objects.filter(classe=classe, date=jour).first()
    presences = {}
    if seance_existante:
        presences = {p.eleve_id: p.statut for p in seance_existante.presences.all()}

    return render(
        request,
        "presence/faire_appel.html",
        {"classe": classe, "eleves": eleves, "jour": jour, "presences": presences},
    )


@role_required(Utilisateur.Role.PROFESSEUR)
def historique(request, classe_id):
    classe = get_object_or_404(Classe, pk=classe_id, professeur=request.user)
    seances = classe.seances_appel.all()
    return render(request, "presence/historique.html", {"classe": classe, "seances": seances})


@login_required
def mes_absences(request, eleve_id=None):
    if eleve_id:
        eleve = get_object_or_404(Utilisateur, pk=eleve_id, role=Utilisateur.Role.ELEVE)
        autorise = (
            request.user == eleve
            or request.user.is_admin_ecole
            or LienParentEleve.objects.filter(parent=request.user, eleve=eleve).exists()
        )
        if not autorise:
            messages.error(request, "Vous n'avez pas accès à ces informations.")
            return redirect("core:dashboard")
    else:
        eleve = request.user

    presences = (
        Presence.objects.filter(eleve=eleve)
        .exclude(statut=Presence.Statut.PRESENT)
        .select_related("seance", "seance__classe")
        .order_by("-seance__date")
    )
    return render(request, "presence/mes_absences.html", {"eleve": eleve, "presences": presences})
