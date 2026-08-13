from django.contrib.auth.views import LogoutView
from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("connexion/", views.ConnexionView.as_view(), name="login"),
    path("deconnexion/", LogoutView.as_view(), name="logout"),
    path("inscription/", views.inscription, name="inscription"),
    path("profil/", views.profil, name="profil"),
]
