from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render

from accounts.decorators import role_required
from accounts.models import Utilisateur

from .forms import DossierForm, FichierPersonnelForm
from .models import Dossier, FichierPersonnel

ROLES_AUTORISES = (Utilisateur.Role.PROFESSEUR, Utilisateur.Role.ELEVE)


@role_required(*ROLES_AUTORISES)
def liste(request):
    dossiers = Dossier.objects.filter(proprietaire=request.user)
    fichiers_non_classes = FichierPersonnel.objects.filter(proprietaire=request.user, dossier__isnull=True)
    return render(request, "documents_perso/liste.html", {"dossiers": dossiers, "fichiers_non_classes": fichiers_non_classes})


@role_required(*ROLES_AUTORISES)
def dossier_detail(request, pk):
    dossier = get_object_or_404(Dossier, pk=pk, proprietaire=request.user)
    return render(request, "documents_perso/dossier_detail.html", {"dossier": dossier, "fichiers": dossier.fichiers.all()})


@role_required(*ROLES_AUTORISES)
def creer_dossier(request):
    if request.method == "POST":
        form = DossierForm(request.POST)
        if form.is_valid():
            dossier = form.save(commit=False)
            dossier.proprietaire = request.user
            dossier.save()
            messages.success(request, f"Dossier « {dossier.nom} » créé.")
            return redirect("documents_perso:liste")
    else:
        form = DossierForm()
    return render(request, "documents_perso/creer_dossier.html", {"form": form})


@role_required(*ROLES_AUTORISES)
def supprimer_dossier(request, pk):
    dossier = get_object_or_404(Dossier, pk=pk, proprietaire=request.user)
    dossier.delete()
    messages.success(request, "Dossier supprimé.")
    return redirect("documents_perso:liste")


@role_required(*ROLES_AUTORISES)
def ajouter_fichier(request):
    if request.method == "POST":
        form = FichierPersonnelForm(request.POST, request.FILES, proprietaire=request.user)
        if form.is_valid():
            fichier = form.save(commit=False)
            fichier.proprietaire = request.user
            fichier.save()
            messages.success(request, "Fichier ajouté.")
            if fichier.dossier:
                return redirect("documents_perso:dossier_detail", pk=fichier.dossier.pk)
            return redirect("documents_perso:liste")
    else:
        dossier_id = request.GET.get("dossier")
        form = FichierPersonnelForm(proprietaire=request.user, initial={"dossier": dossier_id})
    return render(request, "documents_perso/ajouter_fichier.html", {"form": form})


@role_required(*ROLES_AUTORISES)
def supprimer_fichier(request, pk):
    fichier = get_object_or_404(FichierPersonnel, pk=pk, proprietaire=request.user)
    dossier_pk = fichier.dossier.pk if fichier.dossier else None
    fichier.delete()
    messages.success(request, "Fichier supprimé.")
    if dossier_pk:
        return redirect("documents_perso:dossier_detail", pk=dossier_pk)
    return redirect("documents_perso:liste")
