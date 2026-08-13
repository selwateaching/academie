from django.conf import settings
from django.db import models

COULEURS = [
    ("#2563eb", "Bleu"),
    ("#16a34a", "Vert"),
    ("#d97706", "Orange"),
    ("#dc2626", "Rouge"),
    ("#7c3aed", "Violet"),
    ("#0891b2", "Cyan"),
    ("#be185d", "Rose"),
    ("#4b5563", "Gris"),
]


class Dossier(models.Model):
    proprietaire = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dossiers")
    nom = models.CharField(max_length=100)
    couleur = models.CharField(max_length=7, choices=COULEURS, default=COULEURS[0][0])
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nom"]
        unique_together = ("proprietaire", "nom")

    def __str__(self):
        return self.nom


class FichierPersonnel(models.Model):
    proprietaire = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="fichiers_personnels")
    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name="fichiers", null=True, blank=True)
    titre = models.CharField(max_length=200)
    fichier = models.FileField(upload_to="perso/%Y/%m/")
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_ajout"]

    def __str__(self):
        return self.titre

    @property
    def extension(self):
        return self.fichier.name.rsplit(".", 1)[-1].upper() if "." in self.fichier.name else ""
