from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from academics.models import Classe
from accounts.decorators import role_required
from accounts.models import Utilisateur
from ai_agent.services import AgentIAError, generer_cours

from .forms import CoursForm, DocumentForm, GenerationCoursForm
from .models import Cours, Document


def _classe_du_professeur(request, classe_id):
    return get_object_or_404(Classe, pk=classe_id, professeur=request.user)


@role_required(Utilisateur.Role.PROFESSEUR)
def creer_cours(request, classe_id):
    classe = _classe_du_professeur(request, classe_id)
    if request.method == "POST":
        form = CoursForm(request.POST)
        if form.is_valid():
            cours = form.save(commit=False)
            cours.classe = classe
            cours.professeur = request.user
            cours.save()
            messages.success(request, "Cours créé et publié.")
            return redirect("courses:detail_cours", pk=cours.pk)
    else:
        form = CoursForm(initial={"publie": True})
    return render(request, "courses/creer_cours.html", {"form": form, "classe": classe})


@role_required(Utilisateur.Role.PROFESSEUR)
def generer_cours_ia(request, classe_id):
    classe = _classe_du_professeur(request, classe_id)
    if request.method == "POST":
        form = GenerationCoursForm(request.POST)
        if form.is_valid():
            try:
                donnees = generer_cours(
                    sujet=form.cleaned_data["sujet"],
                    matiere=classe.matiere,
                    niveau=classe.niveau or classe.nom,
                    objectifs=form.cleaned_data["objectifs"],
                )
            except AgentIAError as exc:
                messages.error(request, str(exc))
                return render(request, "courses/generer_cours.html", {"form": form, "classe": classe})

            contenu = "\n\n".join(
                f"## {section.get('titre_section', '')}\n\n{section.get('contenu', '')}"
                for section in donnees.get("sections", [])
            )
            cours = Cours.objects.create(
                classe=classe,
                professeur=request.user,
                titre=donnees.get("titre", form.cleaned_data["sujet"]),
                introduction=donnees.get("introduction", ""),
                contenu_markdown=contenu,
                points_cles=donnees.get("points_cles", []),
                conclusion=donnees.get("conclusion", ""),
                duree_estimee_minutes=donnees.get("duree_estimee_minutes", 45),
                genere_par_ia=True,
            )
            messages.success(request, "Cours généré par l'agent IA. Vous pouvez le relire avant publication.")
            return redirect("courses:detail_cours", pk=cours.pk)
    else:
        form = GenerationCoursForm()
    return render(request, "courses/generer_cours.html", {"form": form, "classe": classe})


@login_required
def detail_cours(request, pk):
    cours = get_object_or_404(Cours, pk=pk)
    classe = cours.classe
    est_prof = request.user == classe.professeur
    est_eleve = classe.eleves.filter(pk=request.user.pk).exists()
    if not (est_prof or est_eleve or request.user.is_admin_ecole):
        messages.error(request, "Vous n'avez pas accès à ce cours.")
        return redirect("core:dashboard")
    if not cours.publie and not est_prof:
        messages.error(request, "Ce cours n'est pas encore publié.")
        return redirect("academics:detail_classe", pk=classe.pk)
    return render(request, "courses/detail_cours.html", {"cours": cours, "classe": classe, "est_prof": est_prof})


@role_required(Utilisateur.Role.PROFESSEUR)
def modifier_cours(request, pk):
    cours = get_object_or_404(Cours, pk=pk, professeur=request.user)
    if request.method == "POST":
        form = CoursForm(request.POST, instance=cours)
        if form.is_valid():
            form.save()
            messages.success(request, "Cours mis à jour.")
            return redirect("courses:detail_cours", pk=cours.pk)
    else:
        form = CoursForm(instance=cours)
    return render(request, "courses/creer_cours.html", {"form": form, "classe": cours.classe, "modification": True})


@role_required(Utilisateur.Role.PROFESSEUR)
def supprimer_cours(request, pk):
    cours = get_object_or_404(Cours, pk=pk, professeur=request.user)
    classe_pk = cours.classe.pk
    cours.delete()
    messages.success(request, "Cours supprimé.")
    return redirect("academics:detail_classe", pk=classe_pk)


@role_required(Utilisateur.Role.PROFESSEUR)
def ajouter_document(request, classe_id):
    classe = _classe_du_professeur(request, classe_id)
    if request.method == "POST":
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            document = form.save(commit=False)
            document.classe = classe
            document.professeur = request.user
            document.save()
            messages.success(request, "Document déposé.")
            return redirect("academics:detail_classe", pk=classe.pk)
    else:
        form = DocumentForm()
    return render(request, "courses/ajouter_document.html", {"form": form, "classe": classe})


@role_required(Utilisateur.Role.PROFESSEUR)
def supprimer_document(request, pk):
    document = get_object_or_404(Document, pk=pk, professeur=request.user)
    classe_pk = document.classe.pk
    document.delete()
    messages.success(request, "Document supprimé.")
    return redirect("academics:detail_classe", pk=classe_pk)
