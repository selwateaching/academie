from django.contrib import admin

from .models import Evenement


@admin.register(Evenement)
class EvenementAdmin(admin.ModelAdmin):
    list_display = ("titre", "type", "date", "professeur", "classe")
    list_filter = ("type",)
