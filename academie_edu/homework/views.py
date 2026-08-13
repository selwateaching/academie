from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from academics.models import Classe
from accounts.decorators import role_required
from accounts.models import Utilisateur
from ai_agent.services import AgentIAError, corriger_copie

from .forms import CopieForm, DevoirForm, ValidationCorrectionForm
from .models import Copie, Devoir


def _classe_du_professeur(request, classe_id):
    return get_object_or_404(Classe, pk=classe_id, professeur=request.user)


@role_required(Utilisateur.Role.PROFESSEUR)
def creer_devoir(request, classe_id):
    classe = _classe_du_professeur(request, classe_id)
    if request.method == "POST":
        form = DevoirForm(request.POST)
        if form.is_valid():
            devoir = form.save(commit=False)
            devoir.classe = classe
            devoir.professeur = request.user
            devoir.save()
            messages.success(request, f"Devoir « {devoir.titre} » créé.")
            return redirect("homework:detail_devoir", pk=devoir.pk)
    else:
        form = DevoirForm()
    return render(request, "homework/creer_devoir.html", {"form": form, "classe": classe})


@login_required
def detail_devoir(request, pk):
    devoir = get_object_or_404(Devoir, pk=pk)
    classe = devoir.classe
    est_prof = request.user == classe.professeur
    est_eleve = classe.eleves.filter(pk=request.user.pk).exists()
    if not (est_prof or est_eleve or request.user.is_admin_ecole):
        messages.error(request, "Vous n'avez pas accès à ce devoir.")
        return redirect("core:dashboard")

    ma_copie = None
    copies = None
    if est_eleve:
        ma_copie = devoir.copies.filter(eleve=request.user).first()
    if est_prof:
        copies = devoir.copies.select_related("eleve").all()

    return render(
        request,
        "homework/detail_devoir.html",
        {"devoir": devoir, "classe": classe, "est_prof": est_prof, "ma_copie": ma_copie, "copies": copies},
    )


@role_required(Utilisateur.Role.ELEVE)
def soumettre_copie(request, pk):
    devoir = get_object_or_404(Devoir, pk=pk)
    if not devoir.classe.eleves.filter(pk=request.user.pk).exists():
        messages.error(request, "Vous n'êtes pas inscrit à cette classe.")
        return redirect("core:dashboard")
    if devoir.copies.filter(eleve=request.user).exists():
        messages.info(request, "Vous avez déjà rendu ce devoir.")
        return redirect("homework:detail_devoir", pk=pk)

    if request.method == "POST":
        form = CopieForm(request.POST, request.FILES)
        if form.is_valid():
            copie = form.save(commit=False)
            copie.devoir = devoir
            copie.eleve = request.user
            copie.save()
            messages.success(request, "Devoir rendu avec succès.")
            return redirect("homework:detail_devoir", pk=pk)
    else:
        form = CopieForm()
    return render(request, "homework/soumettre_copie.html", {"form": form, "devoir": devoir})


@role_required(Utilisateur.Role.PROFESSEUR)
def corriger_copie_ia_vue(request, pk):
    copie = get_object_or_404(Copie, pk=pk, devoir__professeur=request.user)
    reponse = copie.reponse_texte
    if not reponse and copie.fichier and copie.fichier.name.lower().endswith((".txt", ".md")):
        reponse = copie.fichier.read().decode("utf-8", errors="ignore")

    if not reponse:
        messages.error(
            request,
            "La correction automatique nécessite une réponse en texte (le format du fichier déposé n'est pas lisible automatiquement).",
        )
        return redirect("homework:detail_devoir", pk=copie.devoir.pk)

    try:
        resultat = corriger_copie(
            enonce=copie.devoir.enonce,
            bareme_points=copie.devoir.bareme_points,
            reponse_eleve=reponse,
        )
    except AgentIAError as exc:
        messages.error(request, str(exc))
        return redirect("homework:detail_devoir", pk=copie.devoir.pk)

    copie.note = resultat.get("note")
    copie.appreciation_generale = resultat.get("appreciation_generale", "")
    copie.points_forts = resultat.get("points_forts", [])
    copie.points_a_ameliorer = resultat.get("points_a_ameliorer", [])
    copie.correction_detaillee = resultat.get("correction_detaillee", "")
    copie.corrigee_par_ia = True
    copie.validee_par_professeur = False
    copie.save()
    messages.success(request, "Copie corrigée par l'agent IA. Relisez-la avant de la valider.")
    return redirect("homework:valider_correction", pk=copie.pk)


@role_required(Utilisateur.Role.PROFESSEUR)
def valider_correction(request, pk):
    copie = get_object_or_404(Copie, pk=pk, devoir__professeur=request.user)
    if request.method == "POST":
        form = ValidationCorrectionForm(request.POST, instance=copie)
        if form.is_valid():
            copie = form.save(commit=False)
            copie.validee_par_professeur = True
            copie.save()
            messages.success(request, "Correction validée et transmise à l'élève.")
            return redirect("homework:detail_devoir", pk=copie.devoir.pk)
    else:
        form = ValidationCorrectionForm(instance=copie)
    return render(request, "homework/valider_correction.html", {"form": form, "copie": copie})


@login_required
def resultat_copie(request, pk):
    copie = get_object_or_404(Copie, pk=pk)
    if request.user != copie.eleve and request.user != copie.devoir.professeur and not request.user.is_admin_ecole:
        messages.error(request, "Vous n'avez pas accès à cette copie.")
        return redirect("core:dashboard")
    return render(request, "homework/resultat_copie.html", {"copie": copie})
