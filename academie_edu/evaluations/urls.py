from django.urls import path

from . import views

app_name = "evaluations"

urlpatterns = [
    path("", views.choisir_classe, name="choisir_classe"),
    path("classe/<int:classe_id>/", views.carnet_notes, name="carnet_notes"),
    path("classe/<int:classe_id>/nouvelle/", views.creer_evaluation, name="creer_evaluation"),
    path("<int:pk>/modifier/", views.modifier_evaluation, name="modifier_evaluation"),
    path("<int:pk>/supprimer/", views.supprimer_evaluation, name="supprimer_evaluation"),
]
