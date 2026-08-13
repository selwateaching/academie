from django.contrib.auth.models import AbstractUser
from django.db import models


class Utilisateur(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Administrateur"
        PROFESSEUR = "professeur", "Professeur"
        ELEVE = "eleve", "Élève"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ELEVE)
    telephone = models.CharField(max_length=30, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    # Abonnement de l'utilisateur (offre gratuite par défaut, activable par l'admin)
    class Plan(models.TextChoices):
        GRATUIT = "gratuit", "Découverte"
        STANDARD = "standard", "Standard"
        PREMIUM = "premium", "Premium"

    plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.GRATUIT)
    abonnement_actif = models.BooleanField(default=True)
    abonnement_expire_le = models.DateField(blank=True, null=True)

    @property
    def is_admin_ecole(self):
        return self.role == self.Role.ADMIN

    @property
    def is_professeur(self):
        return self.role == self.Role.PROFESSEUR

    @property
    def is_eleve(self):
        return self.role == self.Role.ELEVE

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
