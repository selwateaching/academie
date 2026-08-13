from evaluations.models import NoteEvaluation
from homework.models import Copie
from quizzes.models import Tentative


def calculer_bulletin(classe, eleve):
    """Agrège toutes les notes d'un élève dans une classe (devoirs corrigés,
    contrôles, évaluations manuelles) et calcule une moyenne générale sur 20,
    pondérée par les coefficients des évaluations (devoirs/contrôles = coef. 1)."""
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
    notes_eval = (
        NoteEvaluation.objects.filter(evaluation__classe=classe, eleve=eleve, note__isnull=False)
        .select_related("evaluation")
        .order_by("evaluation__date")
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
    lignes_evaluations = [
        {
            "titre": n.evaluation.titre,
            "note": n.note,
            "coefficient": n.evaluation.coefficient,
            "type": n.evaluation.get_type_display(),
        }
        for n in notes_eval
    ]

    total_pondere, poids_total = 0.0, 0
    for ligne in lignes_devoirs + lignes_quiz:
        total_pondere += ligne["pourcentage"] * 0.2
        poids_total += 1
    for ligne in lignes_evaluations:
        total_pondere += ligne["note"] * ligne["coefficient"]
        poids_total += ligne["coefficient"]

    moyenne_generale = round(total_pondere / poids_total, 1) if poids_total else None

    return {
        "devoirs": lignes_devoirs,
        "quiz": lignes_quiz,
        "evaluations": lignes_evaluations,
        "moyenne_generale": moyenne_generale,
    }
