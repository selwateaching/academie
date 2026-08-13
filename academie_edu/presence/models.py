from django.conf import settings
from django.db import models
from django.utils import timezone

from academics.models import Classe


class Seance(models.Model):
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name="seances_appel")
    professeur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="seances_appel")
    date = models.DateField(default=timezone.localdate)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]
        unique_together = ("classe", "date")

    def __str__(self):
        return f"Appel {self.classe} — {self.date}"

    @property
    def nb_absents(self):
        return self.presences.filter(statut=Presence.Statut.ABSENT).count()

    @property
    def nb_retards(self):
        return self.presences.filter(statut=Presence.Statut.RETARD).count()


class Presence(models.Model):
    class Statut(models.TextChoices):
        PRESENT = "present", "Présent"
        ABSENT = "absent", "Absent"
        RETARD = "retard", "Retard"

    seance = models.ForeignKey(Seance, on_delete=models.CASCADE, related_name="presences")
    eleve = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="presences")
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.PRESENT)

    class Meta:
        unique_together = ("seance", "eleve")

    def __str__(self):
        return f"{self.eleve} — {self.get_statut_display()} ({self.seance.date})"
