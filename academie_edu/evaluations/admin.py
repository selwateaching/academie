from django.contrib import admin

from .models import Evaluation, NoteEvaluation


class NoteInline(admin.TabularInline):
    model = NoteEvaluation
    extra = 0


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ("titre", "classe", "type", "coefficient", "date")
    list_filter = ("classe", "type")
    inlines = [NoteInline]
