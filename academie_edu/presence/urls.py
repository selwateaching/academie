from django.urls import path

from . import views

app_name = "presence"

urlpatterns = [
    path("", views.choisir_classe, name="choisir_classe"),
    path("classe/<int:classe_id>/appel/", views.faire_appel, name="faire_appel"),
    path("classe/<int:classe_id>/historique/", views.historique, name="historique"),
    path("mes-absences/", views.mes_absences, name="mes_absences"),
    path("absences/<int:eleve_id>/", views.mes_absences, name="absences_eleve"),
]
