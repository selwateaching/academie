from django import forms

from academics.models import Classe

from .models import Evenement


class EvenementForm(forms.ModelForm):
    class Meta:
        model = Evenement
        fields = ["titre", "date", "type", "classe", "notes"]
        widgets = {
            "date": forms.DateInput(attrs={"type": "date"}),
            "notes": forms.Textarea(attrs={"rows": 2}),
        }

    def __init__(self, *args, professeur=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["classe"].queryset = Classe.objects.filter(professeur=professeur)
        self.fields["classe"].required = False
