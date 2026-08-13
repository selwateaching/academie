from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render

from academics.models import Classe
from accounts.decorators import role_required
from accounts.models import Utilisateur

from .forms import EvaluationForm
from .models import Evaluation, NoteEvaluation


def _classe_du_professeur(request, classe_id):
    return get_object_or_404(Classe, pk=classe_id, professeur=request.user)


@role_required(Utilisateur.Role.PROFESSEUR)
def choisir_classe(request):
    classes = Classe.objects.filter(professeur=request.user)
    return render(request, "evaluations/choisir_classe.html", {"classes": classes})


def _stats_classe(classe, evaluations):
    moyennes = []
    for eleve in classe.eleves.all():
        total, poids = 0, 0
        for ev in evaluations:
            note = ev.notes.filter(eleve=eleve).first()
            if note and note.note is not None:
                total += note.note * ev.coefficient
                poids += ev.coefficient
        if poids:
            moyennes.append(total / poids)
    return {
        "moyenne": round(sum(moyennes) / len(moyennes), 1) if moyennes else None,
        "meilleure": round(max(moyennes), 1) if moyennes else None,
        "plus_basse": round(min(moyennes), 1) if moyennes else None,
        "nb_validees": len([m for m in moyennes if m >= 10]),
    }


@role_required(Utilisateur.Role.PROFESSEUR)
def carnet_notes(request, classe_id):
    classe = _classe_du_professeur(request, classe_id)
    evaluations = list(classe.evaluations.prefetch_related("notes").order_by("date"))
    eleves = classe.eleves.all().order_by("last_name", "first_name")

    grille = []
    for eleve in eleves:
        ligne = {"eleve": eleve, "notes": []}
        total, poids = 0, 0
        for ev in evaluations:
            note_obj = ev.notes.filter(eleve=eleve).first()
            valeur = note_obj.note if note_obj else None
            ligne["notes"].append(valeur)
            if valeur is not None:
                total += valeur * ev.coefficient
                poids += ev.coefficient
        ligne["moyenne"] = round(total / poids, 1) if poids else None
        grille.append(ligne)

    return render(
        request,
        "evaluations/carnet_notes.html",
        {
            "classe": classe,
            "evaluations": evaluations,
            "grille": grille,
            "stats": _stats_classe(classe, evaluations),
        },
    )


@role_required(Utilisateur.Role.PROFESSEUR)
def creer_evaluation(request, classe_id):
    classe = _classe_du_professeur(request, classe_id)
    eleves = classe.eleves.all().order_by("last_name", "first_name")

    if request.method == "POST":
        form = EvaluationForm(request.POST)
        if form.is_valid():
            evaluation = form.save(commit=False)
            evaluation.classe = classe
            evaluation.professeur = request.user
            evaluation.save()
            for eleve in eleves:
                valeur = request.POST.get(f"note_{eleve.pk}", "").strip()
                if valeur:
                    try:
                        note = float(valeur)
                    except ValueError:
                        continue
                    NoteEvaluation.objects.create(evaluation=evaluation, eleve=eleve, note=note)
            messages.success(request, f"Évaluation « {evaluation.titre} » créée.")
            return redirect("evaluations:carnet_notes", classe_id=classe.pk)
    else:
        form = EvaluationForm(initial={"coefficient": 1})

    return render(request, "evaluations/creer_evaluation.html", {"form": form, "classe": classe, "eleves": eleves})


@role_required(Utilisateur.Role.PROFESSEUR)
def modifier_evaluation(request, pk):
    evaluation = get_object_or_404(Evaluation, pk=pk, professeur=request.user)
    classe = evaluation.classe
    eleves = classe.eleves.all().order_by("last_name", "first_name")
    notes_existantes = {n.eleve_id: n.note for n in evaluation.notes.all()}

    if request.method == "POST":
        form = EvaluationForm(request.POST, instance=evaluation)
        if form.is_valid():
            form.save()
            for eleve in eleves:
                valeur = request.POST.get(f"note_{eleve.pk}", "").strip()
                note_val = float(valeur) if valeur else None
                NoteEvaluation.objects.update_or_create(evaluation=evaluation, eleve=eleve, defaults={"note": note_val})
            messages.success(request, "Évaluation mise à jour.")
            return redirect("evaluations:carnet_notes", classe_id=classe.pk)
    else:
        form = EvaluationForm(instance=evaluation)

    return render(
        request,
        "evaluations/creer_evaluation.html",
        {"form": form, "classe": classe, "eleves": eleves, "notes_existantes": notes_existantes, "modification": True, "evaluation": evaluation},
    )


@role_required(Utilisateur.Role.PROFESSEUR)
def supprimer_evaluation(request, pk):
    evaluation = get_object_or_404(Evaluation, pk=pk, professeur=request.user)
    classe_pk = evaluation.classe.pk
    evaluation.delete()
    messages.success(request, "Évaluation supprimée.")
    return redirect("evaluations:carnet_notes", classe_id=classe_pk)
