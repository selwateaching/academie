from django.contrib import admin

from .models import Cours, Document


@admin.register(Cours)
class CoursAdmin(admin.ModelAdmin):
    list_display = ("titre", "classe", "professeur", "genere_par_ia", "publie", "date_creation")
    list_filter = ("genere_par_ia", "publie")


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("titre", "classe", "professeur", "date_ajout")
