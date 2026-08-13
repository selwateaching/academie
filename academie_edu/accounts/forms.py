from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.utils import timezone

from .models import Utilisateur


class InscriptionForm(UserCreationForm):
    first_name = forms.CharField(label="Prénom", max_length=150, required=True)
    last_name = forms.CharField(label="Nom", max_length=150, required=True)
    email = forms.EmailField(label="Adresse email", required=True)
    role = forms.ChoiceField(
        label="Je suis...",
        choices=[
            (Utilisateur.Role.PROFESSEUR, "Professeur"),
            (Utilisateur.Role.ELEVE, "Élève"),
            (Utilisateur.Role.PARENT, "Parent"),
        ],
        widget=forms.RadioSelect,
    )

    class Meta:
        model = Utilisateur
        fields = ["first_name", "last_name", "username", "email", "role", "password1", "password2"]

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        user.first_name = self.cleaned_data["first_name"]
        user.last_name = self.cleaned_data["last_name"]
        user.role = self.cleaned_data["role"]
        user.client_depuis_le = timezone.localdate()
        if commit:
            user.save()
        return user


class ProfilForm(forms.ModelForm):
    class Meta:
        model = Utilisateur
        fields = ["first_name", "last_name", "email", "telephone", "avatar"]


class LierEnfantForm(forms.Form):
    code_famille = forms.CharField(
        label="Code famille de l'élève",
        max_length=8,
        widget=forms.TextInput(attrs={"placeholder": "Ex : A1B2C3", "class": "text-uppercase"}),
    )

    def clean_code_famille(self):
        code = self.cleaned_data["code_famille"].strip().upper()
        if not Utilisateur.objects.filter(code_famille=code, role=Utilisateur.Role.ELEVE).exists():
            raise forms.ValidationError("Aucun élève ne correspond à ce code.")
        return code
