from django import forms

from .models import Classe


class ClasseForm(forms.ModelForm):
    class Meta:
        model = Classe
        fields = ["nom", "matiere", "niveau", "description"]
        widgets = {
            "description": forms.Textarea(attrs={"rows": 3}),
        }


class RejoindreClasseForm(forms.Form):
    code_acces = forms.CharField(
        label="Code d'accès de la classe",
        max_length=8,
        widget=forms.TextInput(attrs={"placeholder": "Ex : A1B2C3", "class": "text-uppercase"}),
    )

    def clean_code_acces(self):
        code = self.cleaned_data["code_acces"].strip().upper()
        if not Classe.objects.filter(code_acces=code).exists():
            raise forms.ValidationError("Aucune classe ne correspond à ce code.")
        return code
