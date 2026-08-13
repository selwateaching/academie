from django.contrib import admin

from .models import Presence, Seance


class PresenceInline(admin.TabularInline):
    model = Presence
    extra = 0


@admin.register(Seance)
class SeanceAdmin(admin.ModelAdmin):
    list_display = ("classe", "professeur", "date", "nb_absents", "nb_retards")
    list_filter = ("classe",)
    inlines = [PresenceInline]
