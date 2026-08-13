from django.contrib import admin

from .models import Classe


@admin.register(Classe)
class ClasseAdmin(admin.ModelAdmin):
    list_display = ("nom", "matiere", "niveau", "professeur", "nb_eleves", "code_acces")
    search_fields = ("nom", "matiere", "professeur__username")
    filter_horizontal = ("eleves",)
