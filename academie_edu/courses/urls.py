from django.urls import path

from . import views

app_name = "courses"

urlpatterns = [
    path("generer-ia/", views.choisir_classe_ia, name="choisir_classe_ia"),
    path("classe/<int:classe_id>/nouveau/", views.creer_cours, name="creer_cours"),
    path("classe/<int:classe_id>/generer-ia/", views.generer_cours_ia, name="generer_cours_ia"),
    path("classe/<int:classe_id>/document/ajouter/", views.ajouter_document, name="ajouter_document"),
    path("document/<int:pk>/supprimer/", views.supprimer_document, name="supprimer_document"),
    path("<int:pk>/", views.detail_cours, name="detail_cours"),
    path("<int:pk>/modifier/", views.modifier_cours, name="modifier_cours"),
    path("<int:pk>/supprimer/", views.supprimer_cours, name="supprimer_cours"),
]
