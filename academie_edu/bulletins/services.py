from homework.models import Copie
from quizzes.models import Tentative


def calculer_bulletin(classe, eleve):
    copies = (
        Copie.objects.filter(devoir__classe=classe, eleve=eleve, validee_par_professeur=True)
        .select_related("devoir")
        .order_by("devoir__date_creation")
    )
    tentatives = (
        Tentative.objects.filter(quiz__classe=classe, eleve=eleve)
        .select_related("quiz")
        .order_by("date_soumission")
    )

    lignes_devoirs = [
        {
            "titre": c.devoir.titre,
            "note": c.note,
            "bareme": c.devoir.bareme_points,
            "pourcentage": round(c.note / c.devoir.bareme_points * 100) if c.devoir.bareme_points and c.note is not None else 0,
        }
        for c in copies
    ]
    lignes_quiz = [
        {"titre": t.quiz.titre, "note": t.score, "bareme": t.score_max, "pourcentage": t.pourcentage}
        for t in tentatives
    ]

    toutes_lignes = lignes_devoirs + lignes_quiz
    moyenne_generale = round(sum(l["pourcentage"] for l in toutes_lignes) / len(toutes_lignes), 1) if toutes_lignes else None

    return {
        "devoirs": lignes_devoirs,
        "quiz": lignes_quiz,
        "moyenne_generale": moyenne_generale,
    }
