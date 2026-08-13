from django.urls import path

from . import views

app_name = "calendrier"

urlpatterns = [
    path("", views.agenda_professeur, name="agenda_professeur"),
    path("nouveau/", views.creer_evenement, name="creer_evenement"),
    path("<int:pk>/supprimer/", views.supprimer_evenement, name="supprimer_evenement"),
    path("mon-agenda/", views.agenda_eleve, name="agenda_eleve"),
]
