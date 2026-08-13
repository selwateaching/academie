from django.conf import settings
from django.db import models

from academics.models import Classe


class Evaluation(models.Model):
    class Type(models.TextChoices):
        DS = "ds", "Devoir surveillé"
        DM = "dm", "Devoir maison"
        INTERRO = "interro", "Interrogation orale"
        PROJET = "projet", "Projet"

    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name="evaluations")
    professeur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="evaluations_creees")
    titre = models.CharField(max_length=200)
    date = models.DateField()
    type = models.CharField(max_length=10, choices=Type.choices, default=Type.DS)
    coefficient = models.PositiveSmallIntegerField(default=1)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.titre} ({self.classe})"


class NoteEvaluation(models.Model):
    evaluation = models.ForeignKey(Evaluation, on_delete=models.CASCADE, related_name="notes")
    eleve = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes_evaluations")
    note = models.FloatField(null=True, blank=True, help_text="Note sur 20")

    class Meta:
        unique_together = ("evaluation", "eleve")

    def __str__(self):
        return f"{self.eleve} — {self.evaluation} : {self.note}"
