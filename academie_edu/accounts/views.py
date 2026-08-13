from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from django.shortcuts import redirect, render

from .forms import InscriptionForm, ProfilForm


class ConnexionView(LoginView):
    template_name = "accounts/login.html"


def inscription(request):
    if request.user.is_authenticated:
        return redirect("core:dashboard")

    if request.method == "POST":
        form = InscriptionForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f"Bienvenue {user.first_name} ! Votre espace est prêt.")
            return redirect("core:dashboard")
    else:
        form = InscriptionForm()
    return render(request, "accounts/inscription.html", {"form": form})


@login_required
def profil(request):
    if request.method == "POST":
        form = ProfilForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, "Profil mis à jour.")
            return redirect("accounts:profil")
    else:
        form = ProfilForm(instance=request.user)
    return render(request, "accounts/profil.html", {"form": form})
