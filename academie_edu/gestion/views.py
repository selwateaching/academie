from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from accounts import plans as plans_module
from accounts.decorators import role_required
from accounts.models import Utilisateur

from .forms import AbonnementForm, CreerClientForm


@role_required(Utilisateur.Role.ADMIN)
def liste_clients(request):
    clients = Utilisateur.objects.filter(role=Utilisateur.Role.PROFESSEUR).order_by("-date_creation")

    recherche = request.GET.get("q", "").strip()
    if recherche:
        from django.db.models import Q

        clients = clients.filter(
            Q(username__icontains=recherche)
            | Q(first_name__icontains=recherche)
            | Q(last_name__icontains=recherche)
            | Q(email__icontains=recherche)
        )

    plan_filtre = request.GET.get("plan", "")
    if plan_filtre:
        clients = clients.filter(plan=plan_filtre)

    statut_filtre = request.GET.get("statut", "")
    aujourd_hui = timezone.localdate()
    if statut_filtre == "actif":
        clients = clients.filter(abonnement_actif=True).exclude(abonnement_expire_le__lt=aujourd_hui)
    elif statut_filtre == "expire":
        clients = clients.filter(abonnement_actif=True, abonnement_expire_le__lt=aujourd_hui)
    elif statut_filtre == "desactive":
        clients = clients.filter(abonnement_actif=False)

    tous_professeurs = Utilisateur.objects.filter(role=Utilisateur.Role.PROFESSEUR)
    stats = {
        "total": tous_professeurs.count(),
        "actifs": sum(1 for c in tous_professeurs if c.abonnement_est_valide),
        "revenu_mensuel_estime": sum(
            c.plan_info["prix_mensuel_da"] for c in tous_professeurs if c.abonnement_est_valide
        ),
        "par_plan": {
            code: tous_professeurs.filter(plan=code).count() for code in plans_module.PLANS
        },
    }

    return render(
        request,
        "gestion/liste_clients.html",
        {
            "clients": clients,
            "plans": plans_module.PLANS,
            "stats": stats,
            "recherche": recherche,
            "plan_filtre": plan_filtre,
            "statut_filtre": statut_filtre,
        },
    )


@role_required(Utilisateur.Role.ADMIN)
def creer_client(request):
    if request.method == "POST":
        form = CreerClientForm(request.POST)
        if form.is_valid():
            client = form.save()
            messages.success(request, f"Client « {client.get_full_name()} » créé avec l'offre {client.plan_info['label']}.")
            return redirect("gestion:detail_client", pk=client.pk)
    else:
        form = CreerClientForm(initial={"plan": Utilisateur.Plan.GRATUIT})
    return render(request, "gestion/creer_client.html", {"form": form})


@role_required(Utilisateur.Role.ADMIN)
def detail_client(request, pk):
    client = get_object_or_404(Utilisateur, pk=pk, role=Utilisateur.Role.PROFESSEUR)

    if request.method == "POST":
        form = AbonnementForm(request.POST, instance=client)
        if form.is_valid():
            form.save()
            messages.success(request, "Abonnement mis à jour.")
            return redirect("gestion:detail_client", pk=client.pk)
    else:
        form = AbonnementForm(instance=client)

    return render(
        request,
        "gestion/detail_client.html",
        {
            "client": client,
            "form": form,
            "classes": client.classes_enseignees.all(),
        },
    )


@role_required(Utilisateur.Role.ADMIN)
def basculer_statut(request, pk):
    client = get_object_or_404(Utilisateur, pk=pk, role=Utilisateur.Role.PROFESSEUR)
    client.abonnement_actif = not client.abonnement_actif
    client.save(update_fields=["abonnement_actif"])
    etat = "activé" if client.abonnement_actif else "désactivé"
    messages.success(request, f"Abonnement {etat} pour {client.get_full_name()}.")
    return redirect("gestion:liste_clients")
