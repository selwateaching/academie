from django.contrib import admin

from .models import Dossier, FichierPersonnel


@admin.register(Dossier)
class DossierAdmin(admin.ModelAdmin):
    list_display = ("nom", "proprietaire", "date_creation")


@admin.register(FichierPersonnel)
class FichierPersonnelAdmin(admin.ModelAdmin):
    list_display = ("titre", "proprietaire", "dossier", "date_ajout")
