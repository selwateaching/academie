from django.contrib import admin

from .models import Copie, Devoir


@admin.register(Devoir)
class DevoirAdmin(admin.ModelAdmin):
    list_display = ("titre", "classe", "professeur", "bareme_points", "date_limite")


@admin.register(Copie)
class CopieAdmin(admin.ModelAdmin):
    list_display = ("devoir", "eleve", "note", "corrigee_par_ia", "validee_par_professeur")
    list_filter = ("corrigee_par_ia", "validee_par_professeur")
