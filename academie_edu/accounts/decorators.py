from functools import wraps

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect


def acces_ia_autorise(request):
    """Vérifie l'abonnement et le quota IA mensuel du professeur ; affiche un
    message et retourne False si l'accès à l'agent IA doit être bloqué."""
    user = request.user
    if not user.abonnement_est_valide:
        messages.error(request, "Votre abonnement n'est pas actif. Contactez l'administrateur pour le réactiver.")
        return False
    if not user.peut_utiliser_ia():
        messages.error(
            request,
            f"Vous avez atteint la limite de {user.plan_info['max_generations_ia_mois']} générations IA "
            f"ce mois-ci pour l'offre « {user.plan_info['label']} ». Contactez l'administrateur pour passer à une offre supérieure.",
        )
        return False
    return True


def role_required(*roles):
    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def wrapped(request, *args, **kwargs):
            if request.user.role not in roles:
                messages.error(request, "Vous n'avez pas accès à cette page.")
                return redirect("core:dashboard")
            return view_func(request, *args, **kwargs)

        return wrapped

    return decorator
