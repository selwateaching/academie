from django.conf import settings
from django.db import models

from academics.models import Classe


class Evenement(models.Model):
    class Type(models.TextChoices):
        DEVOIR = "devoir", "Devoir"
        CONTROLE = "controle", "Contrôle"
        REUNION = "reunion", "Réunion"
        CONSEIL = "conseil", "Conseil de classe"
        AUTRE = "autre", "Autre"

    professeur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="evenements_crees")
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name="evenements", null=True, blank=True)
    titre = models.CharField(max_length=200)
    date = models.DateField()
    type = models.CharField(max_length=10, choices=Type.choices, default=Type.AUTRE)
    notes = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date"]

    def __str__(self):
        return f"{self.titre} ({self.date})"
