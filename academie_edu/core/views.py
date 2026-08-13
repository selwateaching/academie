from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.shortcuts import redirect, render

from academics.models import Classe
from accounts import plans as plans_module
from accounts.decorators import role_required
from accounts.models import Utilisateur
from homework.models import Copie

from .forms import ContactLyceeForm
from .stats import roster_professeur, stats_professeur


def landing(request):
    if request.user.is_authenticated:
        return redirect("core:dashboard")
    return render(request, "core/landing.html", {"plans": plans_module.PLANS})


@login_required
def dashboard(request):
    user = request.user

    if user.role == Utilisateur.Role.PROFESSEUR:
        classes = Classe.objects.filter(professeur=user)
        return render(
            request,
            "core/dashboard_professeur.html",
            {"classes": classes, "stats": stats_professeur(user)},
        )

    if user.role == Utilisateur.Role.ELEVE:
        classes = Classe.objects.filter(eleves=user)
        mes_copies = Copie.objects.filter(eleve=user).select_related("devoir")
        return render(request, "core/dashboard_eleve.html", {"classes": classes, "mes_copies": mes_copies})

    if user.role == Utilisateur.Role.PARENT:
        enfants = user.enfants.all()
        return render(request, "core/dashboard_parent.html", {"enfants": enfants})

    # Administrateur
    return render(
        request,
        "core/dashboard_admin.html",
        {
            "nb_utilisateurs": Utilisateur.objects.count(),
            "nb_professeurs": Utilisateur.objects.filter(role=Utilisateur.Role.PROFESSEUR).count(),
            "nb_eleves": Utilisateur.objects.filter(role=Utilisateur.Role.ELEVE).count(),
            "nb_classes": Classe.objects.count(),
        },
    )


@role_required(Utilisateur.Role.PROFESSEUR)
def mes_eleves(request):
    return render(request, "core/mes_eleves.html", {"roster": roster_professeur(request.user)})


@role_required(Utilisateur.Role.PROFESSEUR)
def contacter_lycee(request):
    if request.method == "POST":
        form = ContactLyceeForm(request.POST)
        if form.is_valid():
            corps = (
                f"Message envoyé par {request.user.get_full_name()} ({request.user.email})\n\n"
                f"{form.cleaned_data['message']}"
            )
            send_mail(
                subject=f"[Académie IA] {form.cleaned_data['sujet']}",
                message=corps,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.EMAIL_LYCEE],
                fail_silently=False,
            )
            messages.success(request, "Votre message a été envoyé à l'administration du lycée.")
            return redirect("core:dashboard")
    else:
        form = ContactLyceeForm()
    return render(request, "core/contacter_lycee.html", {"form": form})
