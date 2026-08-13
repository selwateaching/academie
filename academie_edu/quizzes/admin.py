from django.contrib import admin

from .models import Question, Quiz, ReponseEleve, Tentative


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("titre", "classe", "professeur", "genere_par_ia", "publie", "date_creation")
    inlines = [QuestionInline]


@admin.register(Tentative)
class TentativeAdmin(admin.ModelAdmin):
    list_display = ("quiz", "eleve", "score", "score_max", "date_soumission")


admin.site.register(ReponseEleve)
