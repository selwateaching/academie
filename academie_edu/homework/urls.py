from django.urls import path

from . import views

app_name = "homework"

urlpatterns = [
    path("classe/<int:classe_id>/nouveau/", views.creer_devoir, name="creer_devoir"),
    path("<int:pk>/", views.detail_devoir, name="detail_devoir"),
    path("<int:pk>/rendre/", views.soumettre_copie, name="soumettre_copie"),
    path("copie/<int:pk>/corriger-ia/", views.corriger_copie_ia_vue, name="corriger_copie_ia"),
    path("copie/<int:pk>/valider/", views.valider_correction, name="valider_correction"),
    path("copie/<int:pk>/resultat/", views.resultat_copie, name="resultat_copie"),
]
