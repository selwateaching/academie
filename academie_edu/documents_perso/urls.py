from django.urls import path

from . import views

app_name = "documents_perso"

urlpatterns = [
    path("", views.liste, name="liste"),
    path("dossier/nouveau/", views.creer_dossier, name="creer_dossier"),
    path("dossier/<int:pk>/", views.dossier_detail, name="dossier_detail"),
    path("dossier/<int:pk>/supprimer/", views.supprimer_dossier, name="supprimer_dossier"),
    path("fichier/ajouter/", views.ajouter_fichier, name="ajouter_fichier"),
    path("fichier/<int:pk>/supprimer/", views.supprimer_fichier, name="supprimer_fichier"),
]
