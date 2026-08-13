from django import forms

DIFFICULTES = [("facile", "Facile"), ("moyen", "Moyen"), ("difficile", "Difficile")]


class GenerationQuizForm(forms.Form):
    sujet = forms.CharField(label="Sujet du contrôle", max_length=200)
    nb_questions = forms.IntegerField(label="Nombre de questions", min_value=3, max_value=20, initial=5)
    difficulte = forms.ChoiceField(label="Difficulté", choices=DIFFICULTES, initial="moyen")


class QuestionManuelleForm(forms.Form):
    enonce = forms.CharField(label="Énoncé de la question", widget=forms.Textarea(attrs={"rows": 2}))
    choix_1 = forms.CharField(label="Choix 1")
    choix_2 = forms.CharField(label="Choix 2")
    choix_3 = forms.CharField(label="Choix 3")
    choix_4 = forms.CharField(label="Choix 4")
    bonne_reponse = forms.ChoiceField(
        label="Bonne réponse",
        choices=[("0", "Choix 1"), ("1", "Choix 2"), ("2", "Choix 3"), ("3", "Choix 4")],
    )
    explication = forms.CharField(label="Explication (optionnel)", required=False, widget=forms.Textarea(attrs={"rows": 2}))
    points = forms.IntegerField(label="Points", initial=2, min_value=1)


class QuizMetaForm(forms.Form):
    titre = forms.CharField(label="Titre du contrôle", max_length=200)
    consigne = forms.CharField(label="Consigne", required=False, widget=forms.Textarea(attrs={"rows": 2}))
