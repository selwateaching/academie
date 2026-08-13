from django import forms

from .models import Dossier, FichierPersonnel


class DossierForm(forms.ModelForm):
    class Meta:
        model = Dossier
        fields = ["nom"]


class FichierPersonnelForm(forms.ModelForm):
    class Meta:
        model = FichierPersonnel
        fields = ["titre", "fichier", "dossier"]

    def __init__(self, *args, proprietaire=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["dossier"].queryset = Dossier.objects.filter(proprietaire=proprietaire)
        self.fields["dossier"].required = False
