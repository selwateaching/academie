from django import forms

from . import programme_national as pn
from .models import Classe


class ClasseForm(forms.ModelForm):
    class Meta:
        model = Classe
        fields = ["nom", "cycle", "annee", "filiere", "matiere", "description"]
        widgets = {
            "description": forms.Textarea(attrs={"rows": 3}),
            "cycle": forms.Select(attrs={"id": "id_cycle"}),
            "annee": forms.Select(attrs={"id": "id_annee"}),
            "filiere": forms.Select(attrs={"id": "id_filiere"}),
            "matiere": forms.Select(attrs={"id": "id_matiere"}),
        }

    def clean(self):
        cleaned = super().clean()
        cycle = cleaned.get("cycle")
        annee = cleaned.get("annee")
        filiere = cleaned.get("filiere", "")
        matiere = cleaned.get("matiere")

        if not cycle or not annee:
            return cleaned

        if pn.get_cycle_de_annee(annee) != cycle:
            raise forms.ValidationError("L'année sélectionnée ne correspond pas au cycle choisi.")

        filieres_possibles = pn.get_filieres_de_annee(annee)
        if filieres_possibles and not filiere:
            raise forms.ValidationError("Merci de sélectionner une filière pour ce niveau.")
        if not filieres_possibles and filiere:
            cleaned["filiere"] = ""
            filiere = ""
        if filiere and filiere not in filieres_possibles:
            raise forms.ValidationError("La filière sélectionnée ne correspond pas à cette année.")

        matieres_possibles = pn.get_matieres(annee, filiere)
        if matiere not in matieres_possibles:
            raise forms.ValidationError("Merci de sélectionner une matière du programme national.")

        return cleaned


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
