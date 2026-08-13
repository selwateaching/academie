from django import forms
from django.contrib.auth.password_validation import validate_password

from accounts.models import Utilisateur


class CreerClientForm(forms.ModelForm):
    password = forms.CharField(
        label="Mot de passe initial",
        widget=forms.PasswordInput,
        help_text="Communiquez-le au client ; il pourra le changer depuis son profil.",
    )

    class Meta:
        model = Utilisateur
        fields = ["first_name", "last_name", "username", "email", "telephone", "plan", "abonnement_expire_le"]
        widgets = {
            "abonnement_expire_le": forms.DateInput(attrs={"type": "date"}),
        }

    def clean_password(self):
        password = self.cleaned_data["password"]
        validate_password(password)
        return password

    def save(self, commit=True):
        from django.utils import timezone

        user = super().save(commit=False)
        user.role = Utilisateur.Role.PROFESSEUR
        user.abonnement_actif = True
        user.client_depuis_le = timezone.localdate()
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user


class AbonnementForm(forms.ModelForm):
    class Meta:
        model = Utilisateur
        fields = ["plan", "abonnement_actif", "abonnement_expire_le"]
        widgets = {
            "abonnement_expire_le": forms.DateInput(attrs={"type": "date"}),
        }
