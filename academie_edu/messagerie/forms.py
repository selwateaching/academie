from django import forms

from .models import EXTENSIONS_AUTORISEES


class MessageForm(forms.Form):
    contenu = forms.CharField(
        label="Message",
        required=False,
        widget=forms.Textarea(attrs={"rows": 3, "placeholder": "Écrivez votre message..."}),
    )
    fichier = forms.FileField(label="Pièce jointe (PDF, Word ou image)", required=False)

    def clean_fichier(self):
        fichier = self.cleaned_data.get("fichier")
        if fichier:
            extension = fichier.name.rsplit(".", 1)[-1].lower() if "." in fichier.name else ""
            if extension not in EXTENSIONS_AUTORISEES:
                raise forms.ValidationError(
                    "Format non autorisé. Formats acceptés : PDF, Word (.doc/.docx), images (.jpg/.png/.gif/.webp)."
                )
        return fichier

    def clean(self):
        cleaned = super().clean()
        if not cleaned.get("contenu") and not cleaned.get("fichier"):
            raise forms.ValidationError("Écrivez un message ou joignez un fichier.")
        return cleaned
