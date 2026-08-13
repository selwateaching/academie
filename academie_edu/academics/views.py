from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from accounts.decorators import role_required
from accounts.models import Utilisateur

from . import programme_national as pn
from .forms import ClasseForm, RejoindreClasseForm
from .models import Classe


@role_required(Utilisateur.Role.PROFESSEUR)
def creer_classe(request):
    if not request.user.abonnement_est_valide:
        messages.error(request, "Votre abonnement n'est pas actif. Contactez l'administrateur pour le réactiver.")
        return redirect("core:dashboard")
    if not request.user.peut_creer_classe():
        messages.error(
            request,
            f"Votre offre « {request.user.plan_info['label']} » est limitée à "
            f"{request.user.plan_info['max_classes']} classe(s). Contactez l'administrateur pour passer à une offre supérieure.",
        )
        return redirect("core:dashboard")

    if request.method == "POST":
        form = ClasseForm(request.POST)
        if form.is_valid():
            classe = form.save(commit=False)
            classe.professeur = request.user
            classe.save()
            messages.success(request, f"Classe « {classe.nom} » créée. Code d'accès : {classe.code_acces}")
            return redirect("academics:detail_classe", pk=classe.pk)
    else:
        form = ClasseForm()
    return render(request, "academics/creer_classe.html", {"form": form, "catalogue": pn.catalogue_json()})


@role_required(Utilisateur.Role.ELEVE)
def rejoindre_classe(request):
    if request.method == "POST":
        form = RejoindreClasseForm(request.POST)
        if form.is_valid():
            classe = Classe.objects.get(code_acces=form.cleaned_data["code_acces"])
            classe.eleves.add(request.user)
            messages.success(request, f"Vous avez rejoint la classe « {classe.nom} ».")
            return redirect("academics:detail_classe", pk=classe.pk)
    else:
        form = RejoindreClasseForm()
    return render(request, "academics/rejoindre_classe.html", {"form": form})


@login_required
def detail_classe(request, pk):
    classe = get_object_or_404(Classe, pk=pk)
    est_prof = request.user == classe.professeur
    est_eleve = classe.eleves.filter(pk=request.user.pk).exists()
    if not (est_prof or est_eleve or request.user.is_admin_ecole):
        messages.error(request, "Vous n'avez pas accès à cette classe.")
        return redirect("core:dashboard")

    return render(
        request,
        "academics/detail_classe.html",
        {
            "classe": classe,
            "est_prof": est_prof,
            "cours": classe.cours.all(),
            "quizzes": classe.quizzes.all(),
            "devoirs": classe.devoirs.all(),
        },
    )


@role_required(Utilisateur.Role.PROFESSEUR)
def retirer_eleve(request, pk, eleve_id):
    classe = get_object_or_404(Classe, pk=pk, professeur=request.user)
    classe.eleves.remove(eleve_id)
    messages.success(request, "Élève retiré de la classe.")
    return redirect("academics:detail_classe", pk=classe.pk)
