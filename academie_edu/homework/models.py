from django.conf import settings
from django.db import models

from academics.models import Classe


class Devoir(models.Model):
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name="devoirs")
    professeur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="devoirs_crees")
    titre = models.CharField(max_length=200)
    enonce = models.TextField()
    bareme_points = models.PositiveIntegerField(default=20)
    date_limite = models.DateTimeField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_creation"]

    def __str__(self):
        return self.titre


class Copie(models.Model):
    devoir = models.ForeignKey(Devoir, on_delete=models.CASCADE, related_name="copies")
    eleve = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="copies_rendues")
    reponse_texte = models.TextField(blank=True)
    fichier = models.FileField(upload_to="copies/%Y/%m/", blank=True, null=True)
    date_rendu = models.DateTimeField(auto_now_add=True)

    # Correction (par IA, validable/ajustable par le professeur)
    note = models.FloatField(null=True, blank=True)
    appreciation_generale = models.TextField(blank=True)
    points_forts = models.JSONField(default=list, blank=True)
    points_a_ameliorer = models.JSONField(default=list, blank=True)
    correction_detaillee = models.TextField(blank=True)
    corrigee_par_ia = models.BooleanField(default=False)
    validee_par_professeur = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date_rendu"]
        unique_together = ("devoir", "eleve")

    def __str__(self):
        return f"Copie de {self.eleve} — {self.devoir}"
