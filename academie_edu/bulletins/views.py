from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from academics.models import Classe
from accounts.models import LienParentEleve, Utilisateur

from .services import calculer_bulletin


@login_required
def bulletin_eleve(request, classe_id, eleve_id):
    classe = get_object_or_404(Classe, pk=classe_id)
    eleve = get_object_or_404(Utilisateur, pk=eleve_id, role=Utilisateur.Role.ELEVE)

    autorise = (
        request.user == eleve
        or request.user == classe.professeur
        or request.user.is_admin_ecole
        or LienParentEleve.objects.filter(parent=request.user, eleve=eleve).exists()
    )
    if not autorise or not classe.eleves.filter(pk=eleve.pk).exists():
        messages.error(request, "Vous n'avez pas accès à ce bulletin.")
        return redirect("core:dashboard")

    donnees = calculer_bulletin(classe, eleve)
    return render(
        request,
        "bulletins/bulletin.html",
        {"classe": classe, "eleve": eleve, "donnees": donnees},
    )
