from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.landing, name="landing"),
    path("tableau-de-bord/", views.dashboard, name="dashboard"),
    path("contacter-lycee/", views.contacter_lycee, name="contacter_lycee"),
]
