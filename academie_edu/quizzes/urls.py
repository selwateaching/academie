from django.urls import path

from . import views

app_name = "quizzes"

urlpatterns = [
    path("generer-ia/", views.choisir_classe_ia, name="choisir_classe_ia"),
    path("classe/<int:classe_id>/generer-ia/", views.generer_quiz_ia, name="generer_quiz_ia"),
    path("classe/<int:classe_id>/nouveau/", views.creer_quiz_manuel, name="creer_quiz_manuel"),
    path("<int:pk>/", views.detail_quiz, name="detail_quiz"),
    path("<int:pk>/question/ajouter/", views.ajouter_question, name="ajouter_question"),
    path("<int:pk>/supprimer/", views.supprimer_quiz, name="supprimer_quiz"),
    path("<int:pk>/passer/", views.passer_quiz, name="passer_quiz"),
    path("<int:pk>/resultat/", views.resultat_quiz, name="resultat_quiz"),
]
