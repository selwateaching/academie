from django import forms


class ContactLyceeForm(forms.Form):
    sujet = forms.CharField(label="Objet", max_length=200)
    message = forms.CharField(label="Message", widget=forms.Textarea(attrs={"rows": 6}))
