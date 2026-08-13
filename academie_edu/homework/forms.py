from django import forms

from .models import Copie, Devoir


class DevoirForm(forms.ModelForm):
    class Meta:
        model = Devoir
        fields = ["titre", "enonce", "bareme_points", "date_limite"]
        widgets = {
            "enonce": forms.Textarea(attrs={"rows": 5}),
            "date_limite": forms.DateTimeInput(attrs={"type": "datetime-local"}),
        }


class CopieForm(forms.ModelForm):
    class Meta:
        model = Copie
        fields = ["reponse_texte", "fichier"]
        widgets = {
            "reponse_texte": forms.Textarea(attrs={"rows": 10, "placeholder": "Rédigez votre réponse ici..."}),
        }

    def clean(self):
        cleaned = super().clean()
        if not cleaned.get("reponse_texte") and not cleaned.get("fichier"):
            raise forms.ValidationError("Rédigez une réponse ou déposez un fichier.")
        return cleaned


class ValidationCorrectionForm(forms.ModelForm):
    class Meta:
        model = Copie
        fields = ["note", "appreciation_generale", "correction_detaillee"]
        widgets = {
            "appreciation_generale": forms.Textarea(attrs={"rows": 3}),
            "correction_detaillee": forms.Textarea(attrs={"rows": 8}),
        }
