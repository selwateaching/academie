import random
import string

from django.conf import settings
from django.db import models

from . import programme_national as pn


def generer_code_acces():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


class Classe(models.Model):
    nom = models.CharField(max_length=100, help_text="Ex : 3AM 2, Terminale Sciences B...")
    cycle = models.CharField(max_length=20, choices=pn.CYCLES)
    annee = models.CharField(max_length=10, choices=pn.annees_choices())
    filiere = models.CharField(max_length=30, choices=pn.filieres_choices(), blank=True)
    matiere = models.CharField(max_length=150, help_text="Matière du programme national algérien")
    description = models.TextField(blank=True)
    professeur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="classes_enseignees",
        limit_choices_to={"role": "professeur"},
    )
    eleves = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="classes_suivies",
        blank=True,
        limit_choices_to={"role": "eleve"},
    )
    code_acces = models.CharField(max_length=8, unique=True, editable=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_creation"]

    def save(self, *args, **kwargs):
        if not self.code_acces:
            code = generer_code_acces()
            while Classe.objects.filter(code_acces=code).exists():
                code = generer_code_acces()
            self.code_acces = code
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nom} ({self.matiere})"

    @property
    def nb_eleves(self):
        return self.eleves.count()

    @property
    def niveau_complet(self):
        label = self.get_annee_display()
        if self.filiere:
            label += f" — {self.get_filiere_display()}"
        return label
