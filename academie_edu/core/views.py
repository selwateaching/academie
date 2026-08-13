from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from academics.models import Classe
from accounts import plans as plans_module
from accounts.models import Utilisateur
from homework.models import Copie


def landing(request):
    if request.user.is_authenticated:
        return redirect("core:dashboard")
    return render(request, "core/landing.html", {"plans": plans_module.PLANS})


@login_required
def dashboard(request):
    user = request.user

    if user.role == Utilisateur.Role.PROFESSEUR:
        classes = Classe.objects.filter(professeur=user)
        copies_a_corriger = Copie.objects.filter(devoir__professeur=user, corrigee_par_ia=False).count()
        copies_a_valider = Copie.objects.filter(devoir__professeur=user, corrigee_par_ia=True, validee_par_professeur=False).count()
        return render(
            request,
            "core/dashboard_professeur.html",
            {
                "classes": classes,
                "copies_a_corriger": copies_a_corriger,
                "copies_a_valider": copies_a_valider,
            },
        )

    if user.role == Utilisateur.Role.ELEVE:
        classes = Classe.objects.filter(eleves=user)
        mes_copies = Copie.objects.filter(eleve=user).select_related("devoir")
        return render(request, "core/dashboard_eleve.html", {"classes": classes, "mes_copies": mes_copies})

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
