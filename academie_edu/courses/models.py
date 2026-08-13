from django.conf import settings
from django.db import models

from academics.models import Classe


class Cours(models.Model):
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name="cours")
    professeur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cours_crees")
    titre = models.CharField(max_length=200)
    introduction = models.TextField(blank=True)
    contenu_markdown = models.TextField(blank=True, help_text="Contenu complet du cours, en Markdown")
    points_cles = models.JSONField(default=list, blank=True)
    conclusion = models.TextField(blank=True)
    duree_estimee_minutes = models.PositiveIntegerField(default=45)
    genere_par_ia = models.BooleanField(default=False)
    publie = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_creation"]

    def __str__(self):
        return self.titre


class Document(models.Model):
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name="documents")
    cours = models.ForeignKey(Cours, on_delete=models.CASCADE, related_name="documents", null=True, blank=True)
    professeur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents_deposes")
    titre = models.CharField(max_length=200)
    fichier = models.FileField(upload_to="documents/%Y/%m/")
    description = models.CharField(max_length=300, blank=True)
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_ajout"]

    def __str__(self):
        return self.titre

    @property
    def extension(self):
        return self.fichier.name.rsplit(".", 1)[-1].upper() if "." in self.fichier.name else ""
