from django.urls import path

from . import views

app_name = "gestion"

urlpatterns = [
    path("clients/", views.liste_clients, name="liste_clients"),
    path("clients/nouveau/", views.creer_client, name="creer_client"),
    path("clients/<int:pk>/", views.detail_client, name="detail_client"),
    path("clients/<int:pk>/basculer-statut/", views.basculer_statut, name="basculer_statut"),
]
