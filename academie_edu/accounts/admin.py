from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "role", "plan", "abonnement_actif", "is_active")
    list_filter = ("role", "plan", "abonnement_actif", "is_active")
    fieldsets = UserAdmin.fieldsets + (
        ("Académie", {"fields": ("role", "telephone", "avatar")}),
        (
            "Abonnement",
            {
                "fields": (
                    "plan",
                    "abonnement_actif",
                    "abonnement_expire_le",
                    "client_depuis_le",
                    "generations_ia_mois_courant",
                    "generations_ia_mois_reference",
                )
            },
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Académie", {"fields": ("role", "email", "first_name", "last_name")}),
    )
