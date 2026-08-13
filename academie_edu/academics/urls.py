from django.urls import path

from . import views

app_name = "academics"

urlpatterns = [
    path("creer/", views.creer_classe, name="creer_classe"),
    path("rejoindre/", views.rejoindre_classe, name="rejoindre_classe"),
    path("programme-national/", views.programme_national, name="programme_national"),
    path("<int:pk>/", views.detail_classe, name="detail_classe"),
    path("<int:pk>/ajouter-eleve/", views.ajouter_eleve_manuel, name="ajouter_eleve_manuel"),
    path("<int:pk>/retirer/<int:eleve_id>/", views.retirer_eleve, name="retirer_eleve"),
]
