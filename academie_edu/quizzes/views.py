from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from academics.models import Classe
from accounts.decorators import acces_ia_autorise, role_required
from accounts.models import Utilisateur
from ai_agent.services import AgentIAError, generer_quiz

from .forms import GenerationQuizForm, QuestionManuelleForm, QuizMetaForm
from .models import Question, Quiz, ReponseEleve, Tentative


def _classe_du_professeur(request, classe_id):
    return get_object_or_404(Classe, pk=classe_id, professeur=request.user)


@role_required(Utilisateur.Role.PROFESSEUR)
def choisir_classe_ia(request):
    classes = Classe.objects.filter(professeur=request.user)
    return render(request, "quizzes/choisir_classe_ia.html", {"classes": classes})


@role_required(Utilisateur.Role.PROFESSEUR)
def generer_quiz_ia(request, classe_id):
    classe = _classe_du_professeur(request, classe_id)
    if not acces_ia_autorise(request):
        return redirect("academics:detail_classe", pk=classe.pk)

    if request.method == "POST":
        form = GenerationQuizForm(request.POST)
        if form.is_valid():
            try:
                donnees = generer_quiz(
                    sujet=form.cleaned_data["sujet"],
                    matiere=classe.matiere,
                    cycle=classe.get_cycle_display(),
                    annee=classe.get_annee_display(),
                    filiere=classe.get_filiere_display() if classe.filiere else "",
                    nb_questions=form.cleaned_data["nb_questions"],
                    difficulte=form.cleaned_data["difficulte"],
                )
            except AgentIAError as exc:
                messages.error(request, str(exc))
                return render(request, "quizzes/generer_quiz.html", {"form": form, "classe": classe})
            request.user.enregistrer_utilisation_ia()

            quiz = Quiz.objects.create(
                classe=classe,
                professeur=request.user,
                titre=donnees.get("titre", form.cleaned_data["sujet"]),
                consigne=donnees.get("consigne", ""),
                genere_par_ia=True,
            )
            for i, q in enumerate(donnees.get("questions", [])):
                Question.objects.create(
                    quiz=quiz,
                    ordre=i,
                    enonce=q.get("enonce", ""),
                    choix=q.get("choix", []),
                    index_bonne_reponse=q.get("index_bonne_reponse", 0),
                    explication=q.get("explication", ""),
                    points=q.get("points", 2),
                )
            messages.success(request, f"Contrôle « {quiz.titre} » généré avec {quiz.questions.count()} questions.")
            return redirect("quizzes:detail_quiz", pk=quiz.pk)
    else:
        form = GenerationQuizForm()
    return render(request, "quizzes/generer_quiz.html", {"form": form, "classe": classe})


@role_required(Utilisateur.Role.PROFESSEUR)
def creer_quiz_manuel(request, classe_id):
    classe = _classe_du_professeur(request, classe_id)
    if request.method == "POST":
        form = QuizMetaForm(request.POST)
        if form.is_valid():
            quiz = Quiz.objects.create(
                classe=classe,
                professeur=request.user,
                titre=form.cleaned_data["titre"],
                consigne=form.cleaned_data["consigne"],
            )
            messages.success(request, "Contrôle créé. Ajoutez maintenant vos questions.")
            return redirect("quizzes:ajouter_question", pk=quiz.pk)
    else:
        form = QuizMetaForm()
    return render(request, "quizzes/creer_quiz.html", {"form": form, "classe": classe})


@role_required(Utilisateur.Role.PROFESSEUR)
def ajouter_question(request, pk):
    quiz = get_object_or_404(Quiz, pk=pk, professeur=request.user)
    if request.method == "POST":
        form = QuestionManuelleForm(request.POST)
        if form.is_valid():
            Question.objects.create(
                quiz=quiz,
                ordre=quiz.questions.count(),
                enonce=form.cleaned_data["enonce"],
                choix=[form.cleaned_data[f"choix_{i}"] for i in range(1, 5)],
                index_bonne_reponse=int(form.cleaned_data["bonne_reponse"]),
                explication=form.cleaned_data["explication"],
                points=form.cleaned_data["points"],
            )
            messages.success(request, "Question ajoutée.")
            return redirect("quizzes:detail_quiz", pk=quiz.pk)
    else:
        form = QuestionManuelleForm()
    return render(request, "quizzes/ajouter_question.html", {"form": form, "quiz": quiz})


@login_required
def detail_quiz(request, pk):
    quiz = get_object_or_404(Quiz, pk=pk)
    classe = quiz.classe
    est_prof = request.user == classe.professeur
    est_eleve = classe.eleves.filter(pk=request.user.pk).exists()
    if not (est_prof or est_eleve or request.user.is_admin_ecole):
        messages.error(request, "Vous n'avez pas accès à ce contrôle.")
        return redirect("core:dashboard")

    tentative = None
    if est_eleve:
        tentative = quiz.tentatives.filter(eleve=request.user).first()

    return render(
        request,
        "quizzes/detail_quiz.html",
        {"quiz": quiz, "classe": classe, "est_prof": est_prof, "tentative": tentative},
    )


@role_required(Utilisateur.Role.PROFESSEUR)
def supprimer_quiz(request, pk):
    quiz = get_object_or_404(Quiz, pk=pk, professeur=request.user)
    classe_pk = quiz.classe.pk
    quiz.delete()
    messages.success(request, "Contrôle supprimé.")
    return redirect("academics:detail_classe", pk=classe_pk)


@role_required(Utilisateur.Role.ELEVE)
def passer_quiz(request, pk):
    quiz = get_object_or_404(Quiz, pk=pk)
    classe = quiz.classe
    if not classe.eleves.filter(pk=request.user.pk).exists():
        messages.error(request, "Vous n'êtes pas inscrit à cette classe.")
        return redirect("core:dashboard")
    if quiz.tentatives.filter(eleve=request.user).exists():
        messages.info(request, "Vous avez déjà passé ce contrôle.")
        return redirect("quizzes:resultat_quiz", pk=pk)

    questions = list(quiz.questions.all())

    if request.method == "POST":
        score = 0
        tentative = Tentative.objects.create(quiz=quiz, eleve=request.user, score=0, score_max=quiz.note_max)
        for question in questions:
            valeur = request.POST.get(f"question_{question.id}")
            index_choisi = int(valeur) if valeur is not None else None
            ReponseEleve.objects.create(tentative=tentative, question=question, index_choisi=index_choisi)
            if index_choisi == question.index_bonne_reponse:
                score += question.points
        tentative.score = score
        tentative.save(update_fields=["score"])
        messages.success(request, "Contrôle soumis ! Votre correction est disponible immédiatement.")
        return redirect("quizzes:resultat_quiz", pk=pk)

    return render(request, "quizzes/passer_quiz.html", {"quiz": quiz, "questions": questions})


@role_required(Utilisateur.Role.ELEVE)
def resultat_quiz(request, pk):
    quiz = get_object_or_404(Quiz, pk=pk)
    tentative = get_object_or_404(Tentative.objects.prefetch_related("reponses__question"), quiz=quiz, eleve=request.user)
    return render(request, "quizzes/resultat_quiz.html", {"quiz": quiz, "tentative": tentative})
