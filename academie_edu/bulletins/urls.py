from django.urls import path

from . import views

app_name = "bulletins"

urlpatterns = [
    path("classe/<int:classe_id>/eleve/<int:eleve_id>/", views.bulletin_eleve, name="bulletin_eleve"),
]
