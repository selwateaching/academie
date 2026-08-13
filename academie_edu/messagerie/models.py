from django.conf import settings
from django.db import models

EXTENSIONS_AUTORISEES = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "gif", "webp"]


class Conversation(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="conversations")
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_creation"]

    def autre_participant(self, utilisateur):
        return self.participants.exclude(pk=utilisateur.pk).first()

    def dernier_message(self):
        return self.messages.order_by("-date_envoi").first()

    def non_lus_pour(self, utilisateur):
        return self.messages.filter(lu=False).exclude(expediteur=utilisateur).count()

    def __str__(self):
        noms = ", ".join(str(p) for p in self.participants.all())
        return f"Conversation ({noms})"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    expediteur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="messages_envoyes")
    contenu = models.TextField(blank=True)
    fichier = models.FileField(upload_to="messagerie/%Y/%m/", blank=True, null=True)
    date_envoi = models.DateTimeField(auto_now_add=True)
    lu = models.BooleanField(default=False)

    class Meta:
        ordering = ["date_envoi"]

    def __str__(self):
        return f"{self.expediteur} — {self.contenu[:40]}"

    @property
    def extension_fichier(self):
        if not self.fichier:
            return ""
        nom = self.fichier.name
        return nom.rsplit(".", 1)[-1].upper() if "." in nom else ""
