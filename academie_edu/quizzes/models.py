from django.conf import settings
from django.db import models

from academics.models import Classe


class Quiz(models.Model):
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name="quizzes")
    professeur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quizzes_crees")
    titre = models.CharField(max_length=200)
    consigne = models.TextField(blank=True)
    genere_par_ia = models.BooleanField(default=False)
    publie = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_creation"]
        verbose_name = "Contrôle / Quiz"
        verbose_name_plural = "Contrôles / Quiz"

    def __str__(self):
        return self.titre

    @property
    def note_max(self):
        return sum(q.points for q in self.questions.all())


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    ordre = models.PositiveIntegerField(default=0)
    enonce = models.TextField()
    choix = models.JSONField(default=list, help_text="Liste des choix proposés")
    index_bonne_reponse = models.PositiveSmallIntegerField()
    explication = models.TextField(blank=True)
    points = models.PositiveIntegerField(default=2)

    class Meta:
        ordering = ["ordre", "id"]

    def __str__(self):
        return self.enonce[:60]


class Tentative(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="tentatives")
    eleve = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tentatives_quiz")
    date_soumission = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(default=0)
    score_max = models.FloatField(default=0)

    class Meta:
        ordering = ["-date_soumission"]
        unique_together = ("quiz", "eleve")

    def __str__(self):
        return f"{self.eleve} — {self.quiz} ({self.score}/{self.score_max})"

    @property
    def pourcentage(self):
        return round((self.score / self.score_max) * 100) if self.score_max else 0


class ReponseEleve(models.Model):
    tentative = models.ForeignKey(Tentative, on_delete=models.CASCADE, related_name="reponses")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="reponses_eleves")
    index_choisi = models.PositiveSmallIntegerField(null=True, blank=True)

    @property
    def est_correcte(self):
        return self.index_choisi == self.question.index_bonne_reponse
