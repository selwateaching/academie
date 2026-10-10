import engine

SERVICES = {s: {"id": i, "slug": s, "name": s, "price": 40, "duration": 30} for i, s in enumerate(["soin-x", "lissage", "diag"], 1)}
DIAG = {"category": "cheveux", "questions": [
    {"id": "state", "label": "?", "type": "single", "options": [{"value": "bleached"}, {"value": "natural"}]},
    {"id": "dry", "label": "?", "type": "scale", "options": [{"value": str(i)} for i in range(1, 6)]},
    {"id": "preg", "label": "?", "type": "single", "options": [{"value": "yes"}, {"value": "no"}]},
    {"id": "when", "label": "?", "type": "single", "options": [{"value": "a"}], "show_if": {"q": "state", "op": "eq", "v": "bleached"}},
]}


def rule(i, cond, act, prio=100):
    return {"id": i, "name": f"r{i}", "condition": cond, "action": act, "priority": prio, "active": 1}


RULES = [
    rule(1, {"q": "state", "op": "eq", "v": "bleached"}, {"verdict": "caution", "recommend": ["soin-x"]}),
    rule(2, {"all": [{"q": "dry", "op": "gte", "v": 4}, {"q": "state", "op": "eq", "v": "bleached"}]}, {"verdict": "prepare", "recommend": ["soin-x", "diag"]}),
    rule(3, {"q": "preg", "op": "eq", "v": "yes"}, {"validation": True, "alert": "Grossesse"}),
]
LISS = SERVICES["lissage"]


def ev(answers, rules=RULES):
    return engine.evaluate(DIAG, rules, answers, SERVICES, LISS)


def test_good_condition_allows_service():
    r = ev({"state": "natural", "dry": "1", "preg": "no"})
    assert r["verdict"] == "go" and [x["slug"] for x in r["recommended"]] == ["lissage"] and not r["needs_validation"]


def test_damaged_hair_recommends_preparation_before_smoothing():
    r = ev({"state": "bleached", "dry": "5", "preg": "no"})
    assert r["verdict"] == "prepare"
    assert [x["slug"] for x in r["recommended"]] == ["soin-x", "diag"]
    assert r["steps"][-1].startswith("lissage après amélioration")
    assert "ne pas réaliser immédiatement" in r["message"]


def test_most_severe_verdict_wins_and_validation_flag_accumulates():
    r = ev({"state": "bleached", "dry": "5", "preg": "yes"})
    assert r["verdict"] == "prepare" and r["needs_validation"] and r["alerts"] == ["Grossesse"]


def test_pregnancy_alert_only_requires_validation():
    r = ev({"state": "natural", "dry": "2", "preg": "yes"})
    assert r["verdict"] == "go" and r["needs_validation"]


def test_inactive_rule_ignored_and_disclaimer_always_present():
    r = ev({"state": "bleached", "dry": "5"}, [{**RULES[1], "active": 0}])
    assert r["verdict"] == "go" and "pas un diagnostic médical" in r["disclaimer"]


def test_hidden_questions_ignored():
    # « when » dépend de state=bleached : sa réponse est ignorée si la question est masquée
    qs = engine.visible_questions(DIAG["questions"], {"state": "natural"})
    assert "when" not in [q["id"] for q in qs]
    assert engine.missing_required(DIAG, {"state": "natural", "dry": "1", "preg": "no"}) == []
    assert engine.missing_required(DIAG, {"state": "bleached", "dry": "1", "preg": "no"}) == ["when"]


def test_operators():
    a = {"m": ["x", "y"], "n": "3"}
    assert engine.eval_condition({"q": "m", "op": "has", "v": "x"}, a)
    assert engine.eval_condition({"q": "m", "op": "has_any", "v": ["z", "y"]}, a)
    assert not engine.eval_condition({"q": "m", "op": "not_has", "v": "x"}, a)
    assert engine.eval_condition({"q": "n", "op": "in", "v": ["3", "4"]}, a)
    assert engine.eval_condition({"q": "n", "op": "lte", "v": 3}, a)
    assert not engine.eval_condition({"q": "absent", "op": "answered"}, a)
    assert engine.eval_condition({}, a)
