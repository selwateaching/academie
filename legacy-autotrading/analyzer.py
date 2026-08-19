import os
import json
import re
import anthropic

MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """Tu es un expert en négoce automobile professionnel en France.
Tu analyses des annonces de véhicules pour aider un négociant automobile à prendre des décisions d'achat rentables.

Contexte métier :
- Le négociant achète des véhicules pour les revendre avec une marge bénéficiaire
- Les sources sont : BCA (enchères professionnelles), AUTO1 (plateforme B2B), LeBonCoin (particuliers), Particuliers
- Les frais à prendre en compte : remise en état (carrosserie, mécanique), malus éventuel, frais de carte grise, TVA si applicable, préparation/nettoyage
- La marge nette visée est de 15-25% du prix de revente
- Les véhicules diesel de plus de 7 ans sont plus difficiles à revendre en ville
- Les véhicules hybrides et électriques se vendent bien mais coûtent plus cher à l'achat
- BCA et AUTO1 proposent des prix proches du marché B2B
- Les particuliers sur LeBonCoin peuvent offrir des prix en-dessous du marché

Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans markdown."""

USER_PROMPT_TEMPLATE = """Analyse cette opportunité d'achat/revente de véhicule :

Marque/Modèle : {brand} {model}
Année : {year}
Kilométrage : {km} km
Motorisation : {motorization}
Prix demandé : {price_asked} €
Source : {source}
Localisation : {location}

Texte brut de l'annonce :
{raw_text}

Fournis une analyse complète en JSON avec exactement cette structure :
{{
  "decision": "ACHETER" ou "À ÉTUDIER" ou "REFUSER",
  "score": entier entre 0 et 100 (opportunité globale),
  "buy_price": prix d'achat conseillé en float,
  "resell_price": prix de revente estimé en float,
  "estimated_fees": estimation des frais totaux (remise en état + admin) en float,
  "net_margin": marge nette estimée en float (resell_price - buy_price - estimated_fees),
  "risk_level": "Faible" ou "Moyen" ou "Élevé",
  "strengths": liste de 2-4 points forts (array de strings),
  "weaknesses": liste de 2-4 points faibles ou risques (array de strings),
  "summary": texte de 2-3 phrases résumant l'analyse et la recommandation
}}"""


def analyze_vehicle(vehicle_data: dict) -> dict | None:
    """
    Send vehicle data to Claude for analysis.
    Returns parsed JSON dict or None on failure.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY not set")
        return _fallback_analysis(vehicle_data)

    client = anthropic.Anthropic(api_key=api_key)

    def fmt(val, default="Non précisé"):
        if val is None or val == "":
            return default
        return val

    prompt = USER_PROMPT_TEMPLATE.format(
        brand=fmt(vehicle_data.get("brand")),
        model=fmt(vehicle_data.get("model")),
        year=fmt(vehicle_data.get("year")),
        km=fmt(vehicle_data.get("km")),
        motorization=fmt(vehicle_data.get("motorization")),
        price_asked=fmt(vehicle_data.get("price_asked")),
        source=fmt(vehicle_data.get("source")),
        location=fmt(vehicle_data.get("location")),
        raw_text=str(vehicle_data.get("raw_text", ""))[:3000],
    )

    try:
        message = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text.strip()
        return _parse_json_response(response_text)

    except anthropic.APIConnectionError as e:
        print(f"Anthropic connection error: {e}")
    except anthropic.RateLimitError as e:
        print(f"Anthropic rate limit: {e}")
    except anthropic.APIStatusError as e:
        print(f"Anthropic API error {e.status_code}: {e.message}")
    except Exception as e:
        print(f"Unexpected analyzer error: {e}")

    return _fallback_analysis(vehicle_data)


def _parse_json_response(text: str) -> dict | None:
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to extract JSON block from markdown
    json_match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', text)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find JSON object in text
    obj_match = re.search(r'\{[\s\S]+\}', text)
    if obj_match:
        try:
            return json.loads(obj_match.group(0))
        except json.JSONDecodeError:
            pass

    print(f"Failed to parse Claude response as JSON: {text[:200]}")
    return None


def _fallback_analysis(vehicle_data: dict) -> dict:
    """Generate a basic rule-based analysis when AI is unavailable."""
    price = vehicle_data.get("price_asked") or 10000
    km = vehicle_data.get("km") or 100000
    year = vehicle_data.get("year") or 2015
    source = vehicle_data.get("source", "Particulier")

    import datetime
    age = datetime.datetime.now().year - year if year else 8

    # Score heuristic
    score = 50
    if price < 8000:
        score += 10
    if km < 80000:
        score += 10
    elif km > 200000:
        score -= 20
    if age < 5:
        score += 15
    elif age > 10:
        score -= 10
    if source == "Particulier":
        score += 5
    score = max(0, min(100, score))

    fees = price * 0.08
    buy_price = price * 0.9
    resell_price = price * 1.15
    net_margin = resell_price - buy_price - fees

    if score >= 70:
        decision = "ACHETER"
    elif score >= 45:
        decision = "À ÉTUDIER"
    else:
        decision = "REFUSER"

    if km > 200000 or age > 12:
        risk = "Élevé"
    elif km > 120000 or age > 8:
        risk = "Moyen"
    else:
        risk = "Faible"

    return {
        "decision": decision,
        "score": score,
        "buy_price": round(buy_price, 0),
        "resell_price": round(resell_price, 0),
        "estimated_fees": round(fees, 0),
        "net_margin": round(net_margin, 0),
        "risk_level": risk,
        "strengths": ["Analyse heuristique (IA indisponible)", "Données partielles disponibles"],
        "weaknesses": ["Clé API Anthropic non configurée", "Analyse non personnalisée"],
        "summary": "Analyse automatique de secours (clé API Anthropic manquante). Configurez ANTHROPIC_API_KEY pour des analyses IA complètes.",
    }
