from django import forms

from .models import Cours, Document


class CoursForm(forms.ModelForm):
    class Meta:
        model = Cours
        fields = ["titre", "introduction", "contenu_markdown", "conclusion", "publie"]
        widgets = {
            "introduction": forms.Textarea(attrs={"rows": 3}),
            "contenu_markdown": forms.Textarea(attrs={"rows": 14}),
            "conclusion": forms.Textarea(attrs={"rows": 3}),
        }


class GenerationCoursForm(forms.Form):
    sujet = forms.CharField(label="Sujet du cours", max_length=200)
    objectifs = forms.CharField(
        label="Objectifs pédagogiques (optionnel)",
        required=False,
        widget=forms.Textarea(attrs={"rows": 2}),
    )


class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ["titre", "fichier", "description"]
