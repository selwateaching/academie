import random
import string

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from . import plans


def generer_code_famille():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


class Utilisateur(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Administrateur"
        PROFESSEUR = "professeur", "Professeur"
        ELEVE = "eleve", "Élève"
        PARENT = "parent", "Parent"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ELEVE)
    telephone = models.CharField(max_length=30, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    # Code permettant à un parent de se lier à ce compte élève (généré à la création)
    code_famille = models.CharField(max_length=8, unique=True, blank=True, null=True)

    # Abonnement de l'utilisateur (offre gratuite par défaut, activable par l'admin)
    class Plan(models.TextChoices):
        GRATUIT = "gratuit", "Découverte"
        STANDARD = "standard", "Standard"
        PREMIUM = "premium", "Premium"

    plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.GRATUIT)
    abonnement_actif = models.BooleanField(default=True)
    abonnement_expire_le = models.DateField(blank=True, null=True)
    client_depuis_le = models.DateField(blank=True, null=True)

    # Suivi de l'usage de l'agent IA (remis à zéro chaque mois)
    generations_ia_mois_courant = models.PositiveIntegerField(default=0)
    generations_ia_mois_reference = models.CharField(max_length=7, blank=True, help_text="Format AAAA-MM")

    @property
    def is_admin_ecole(self):
        return self.role == self.Role.ADMIN

    @property
    def is_professeur(self):
        return self.role == self.Role.PROFESSEUR

    @property
    def is_eleve(self):
        return self.role == self.Role.ELEVE

    @property
    def is_parent(self):
        return self.role == self.Role.PARENT

    def save(self, *args, **kwargs):
        if self.role == self.Role.ELEVE and not self.code_famille:
            code = generer_code_famille()
            while Utilisateur.objects.filter(code_famille=code).exists():
                code = generer_code_famille()
            self.code_famille = code
        super().save(*args, **kwargs)

    @property
    def enfants(self):
        return Utilisateur.objects.filter(liens_parents__parent=self)

    @property
    def plan_info(self):
        return plans.info(self.plan)

    @property
    def abonnement_est_valide(self):
        if not self.abonnement_actif:
            return False
        if self.abonnement_expire_le and self.abonnement_expire_le < timezone.localdate():
            return False
        return True

    @property
    def abonnement_statut_libelle(self):
        if not self.abonnement_actif:
            return "Désactivé"
        if self.abonnement_expire_le and self.abonnement_expire_le < timezone.localdate():
            return "Expiré"
        return "Actif"

    def _reinitialiser_compteur_ia_si_besoin(self):
        mois_actuel = timezone.localdate().strftime("%Y-%m")
        if self.generations_ia_mois_reference != mois_actuel:
            self.generations_ia_mois_reference = mois_actuel
            self.generations_ia_mois_courant = 0

    def peut_creer_classe(self):
        max_classes = self.plan_info["max_classes"]
        if max_classes is None:
            return True
        return self.classes_enseignees.count() < max_classes

    def peut_utiliser_ia(self):
        self._reinitialiser_compteur_ia_si_besoin()
        max_generations = self.plan_info["max_generations_ia_mois"]
        if max_generations is None:
            return True
        return self.generations_ia_mois_courant < max_generations

    def enregistrer_utilisation_ia(self):
        self._reinitialiser_compteur_ia_si_besoin()
        self.generations_ia_mois_courant += 1
        self.save(update_fields=["generations_ia_mois_courant", "generations_ia_mois_reference"])

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class LienParentEleve(models.Model):
    parent = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name="liens_enfants",
        limit_choices_to={"role": Utilisateur.Role.PARENT},
    )
    eleve = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name="liens_parents",
        limit_choices_to={"role": Utilisateur.Role.ELEVE},
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("parent", "eleve")

    def __str__(self):
        return f"{self.parent} ↔ {self.eleve}"
