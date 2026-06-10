import os
import json
import random
from datetime import datetime, timedelta

from flask import Flask, render_template, redirect, url_for, request, jsonify, session, flash
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

from models import db, Vehicle, Analysis, OAuthToken
import gmail_service
import email_parser
import analyzer

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-me')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///auto_trading.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()


# ──────────────────────────────────────────────────────────────────────────────
# Helper: generate demo data if DB is empty
# ──────────────────────────────────────────────────────────────────────────────
def _generate_demo_data():
    """Insert sample vehicles + analyses so the UI has something to show."""
    demo_vehicles = [
        {
            'source': 'BCA', 'brand': 'Peugeot', 'model': '308', 'year': 2019,
            'km': 72000, 'price_asked': 13500, 'motorization': 'Diesel',
            'location': 'Lyon', 'subject': 'Peugeot 308 1.5 BlueHDi 2019 – BCA Auction',
            'decision': 'ACHETER', 'score': 85, 'buy_price': 12800,
            'resell_price': 16500, 'estimated_fees': 800,
            'net_margin': 2900, 'risk_level': 'Faible',
            'strengths': ['Kilométrage raisonnable', 'Motorisation fiable', 'Prix en-dessous du marché'],
            'weaknesses': ['Diesel (restrictions urbaines possibles)', 'Historique entretien inconnu'],
            'summary': 'Belle opportunité sur ce 308 diesel bien préservé. Prix d\'achat compétitif pour une revente estimée à 16 500 €.',
        },
        {
            'source': 'LeBonCoin', 'brand': 'Renault', 'model': 'Clio', 'year': 2020,
            'km': 45000, 'price_asked': 11200, 'motorization': 'Essence',
            'location': 'Paris', 'subject': '[LeBonCoin] Renault Clio V 1.0 TCe 100 2020',
            'decision': 'ACHETER', 'score': 82, 'buy_price': 10500,
            'resell_price': 14000, 'estimated_fees': 600,
            'net_margin': 2900, 'risk_level': 'Faible',
            'strengths': ['Faible kilométrage', 'Récente (2020)', 'Moteur essence polyvalent'],
            'weaknesses': ['Prix légèrement élevé particulier', 'Marché Clio très concurrentiel'],
            'summary': 'Clio récente à faible kilométrage. Marge estimée correcte, risque faible.',
        },
        {
            'source': 'AUTO1', 'brand': 'Volkswagen', 'model': 'Golf', 'year': 2017,
            'km': 118000, 'price_asked': 10900, 'motorization': 'Diesel',
            'location': 'Bordeaux', 'subject': 'AUTO1 – VW Golf VII 2.0 TDI 2017',
            'decision': 'À ÉTUDIER', 'score': 61, 'buy_price': 9800,
            'resell_price': 13200, 'estimated_fees': 1200,
            'net_margin': 2200, 'risk_level': 'Moyen',
            'strengths': ['Motorisation robuste', 'Marque recherchée'],
            'weaknesses': ['Kilométrage élevé', 'Diesel âgé, ventes en baisse', 'Frais de remise en état potentiels'],
            'summary': 'Golf TDI correcte mais kilométrage important. Vérifier l\'état de la distribution avant achat.',
        },
        {
            'source': 'Particulier', 'brand': 'BMW', 'model': 'Serie 3', 'year': 2015,
            'km': 165000, 'price_asked': 9500, 'motorization': 'Diesel',
            'location': 'Marseille', 'subject': 'BMW 318d 2015 – vente urgente',
            'decision': 'REFUSER', 'score': 28, 'buy_price': 7500,
            'resell_price': 10500, 'estimated_fees': 2000,
            'net_margin': 1000, 'risk_level': 'Élevé',
            'strengths': ['Prix négociable', 'Marque premium'],
            'weaknesses': ['Très fort kilométrage', 'Coûts d\'entretien BMW élevés', 'Diesel > 7 ans difficile à revendre', 'Marge nette insuffisante'],
            'summary': 'Kilométrage trop élevé et marge insuffisante après frais. À éviter sauf prix très agressif.',
        },
        {
            'source': 'BCA', 'brand': 'Toyota', 'model': 'Yaris', 'year': 2021,
            'km': 31000, 'price_asked': 15800, 'motorization': 'Hybride',
            'location': 'Nantes', 'subject': 'Toyota Yaris Hybride 2021 BCA',
            'decision': 'ACHETER', 'score': 91, 'buy_price': 15000,
            'resell_price': 19500, 'estimated_fees': 500,
            'net_margin': 4000, 'risk_level': 'Faible',
            'strengths': ['Hybride très demandé', 'Très faible kilométrage', 'Fiabilité Toyota reconnue', 'Forte demande marché'],
            'weaknesses': ['Prix d\'achat élevé', 'Moins de marge de négociation'],
            'summary': 'Excellent dossier. Yaris hybride récente très demandée. Marge nette de 4 000 € estimée.',
        },
        {
            'source': 'LeBonCoin', 'brand': 'Dacia', 'model': 'Duster', 'year': 2018,
            'km': 88000, 'price_asked': 8900, 'motorization': 'Diesel',
            'location': 'Toulouse', 'subject': 'Dacia Duster 1.5 dCi 110 2018 4x2',
            'decision': 'À ÉTUDIER', 'score': 55, 'buy_price': 8200,
            'resell_price': 11000, 'estimated_fees': 900,
            'net_margin': 1900, 'risk_level': 'Moyen',
            'strengths': ['Prix d\'entrée bas', 'SUV demandé'],
            'weaknesses': ['Marge modeste', 'Diesel vieillissant', 'Finition basique peut freiner'],
            'summary': 'Duster diesel honnête mais marge limitée. Intéressant si remise en état minime.',
        },
    ]

    base_date = datetime.utcnow() - timedelta(days=len(demo_vehicles))
    for i, vd in enumerate(demo_vehicles):
        v = Vehicle(
            source=vd['source'],
            email_id=f'demo_{i}_{vd["brand"]}',
            subject=vd['subject'],
            received_at=base_date + timedelta(days=i),
            brand=vd['brand'],
            model=vd['model'],
            motorization=vd['motorization'],
            year=vd['year'],
            km=vd['km'],
            price_asked=vd['price_asked'],
            location=vd['location'],
            raw_text='[Données de démonstration]',
            analyzed_at=base_date + timedelta(days=i, hours=1),
        )
        db.session.add(v)
        db.session.flush()

        a = Analysis(
            vehicle_id=v.id,
            decision=vd['decision'],
            score=vd['score'],
            buy_price=vd['buy_price'],
            resell_price=vd['resell_price'],
            estimated_fees=vd['estimated_fees'],
            net_margin=vd['net_margin'],
            risk_level=vd['risk_level'],
            summary=vd['summary'],
        )
        a.strengths = vd['strengths']
        a.weaknesses = vd['weaknesses']
        db.session.add(a)

    db.session.commit()


# ──────────────────────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return redirect(url_for('dashboard'))


@app.route('/dashboard')
def dashboard():
    with app.app_context():
        # Auto-generate demo data on first visit
        if Vehicle.query.count() == 0:
            _generate_demo_data()

    decision_filter = request.args.get('decision', '')
    source_filter = request.args.get('source', '')
    sort_by = request.args.get('sort', 'date')

    query = Vehicle.query.join(Analysis, Vehicle.id == Analysis.vehicle_id, isouter=True)

    if decision_filter:
        query = query.filter(Analysis.decision == decision_filter)
    if source_filter:
        query = query.filter(Vehicle.source == source_filter)

    if sort_by == 'score':
        query = query.order_by(Analysis.score.desc().nullslast())
    elif sort_by == 'margin':
        query = query.order_by(Analysis.net_margin.desc().nullslast())
    else:
        query = query.order_by(Vehicle.received_at.desc().nullslast())

    vehicles = query.all()

    # Build combined data for template
    vehicle_data = []
    for v in vehicles:
        latest_analysis = Analysis.query.filter_by(vehicle_id=v.id).order_by(Analysis.created_at.desc()).first()
        vehicle_data.append({'vehicle': v, 'analysis': latest_analysis})

    # Stats
    total = Vehicle.query.count()
    acheter = Analysis.query.filter_by(decision='ACHETER').count()
    a_etudier = Analysis.query.filter_by(decision='À ÉTUDIER').count()
    refuser = Analysis.query.filter_by(decision='REFUSER').count()

    from sqlalchemy import func
    avg_score_row = db.session.query(func.avg(Analysis.score)).scalar()
    avg_score = round(avg_score_row) if avg_score_row else 0

    oauth_status = gmail_service.get_oauth_status()

    return render_template(
        'dashboard.html',
        vehicle_data=vehicle_data,
        total=total,
        acheter=acheter,
        a_etudier=a_etudier,
        refuser=refuser,
        avg_score=avg_score,
        decision_filter=decision_filter,
        source_filter=source_filter,
        sort_by=sort_by,
        oauth_status=oauth_status,
    )


@app.route('/vehicle/<int:vehicle_id>')
def vehicle_detail(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    analysis = Analysis.query.filter_by(vehicle_id=vehicle_id).order_by(Analysis.created_at.desc()).first()
    return render_template('analysis_detail.html', vehicle=vehicle, analysis=analysis)


@app.route('/vehicle/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Véhicule supprimé.'})


@app.route('/sync', methods=['POST'])
def sync_emails():
    max_emails = int(os.environ.get('MAX_EMAILS_PER_SYNC', 50))
    try:
        emails = gmail_service.fetch_emails(max_results=max_emails)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e), 'count': 0}), 500

    processed = 0
    for email in emails:
        # Skip already processed
        if Vehicle.query.filter_by(email_id=email['id']).first():
            continue

        if not email_parser.is_vehicle_announcement(email):
            continue

        source = email_parser.detect_source(email)
        extracted = email_parser.extract_vehicle_data(email)

        body_plain = email.get('body_plain', '') or ''
        body_html = email.get('body_html', '') or ''
        raw_text = body_plain or email_parser.html_to_text(body_html)

        vehicle = Vehicle(
            source=source,
            email_id=email['id'],
            subject=email.get('subject', ''),
            received_at=email.get('date'),
            brand=extracted.get('brand'),
            model=extracted.get('model'),
            motorization=extracted.get('motorization'),
            year=extracted.get('year'),
            km=extracted.get('km'),
            price_asked=extracted.get('price_asked'),
            location=extracted.get('location'),
            raw_text=raw_text[:5000],
        )
        db.session.add(vehicle)
        db.session.flush()

        vehicle_data_for_ai = {
            'brand': vehicle.brand,
            'model': vehicle.model,
            'year': vehicle.year,
            'km': vehicle.km,
            'motorization': vehicle.motorization,
            'price_asked': vehicle.price_asked,
            'source': vehicle.source,
            'location': vehicle.location,
            'raw_text': raw_text[:3000],
        }

        result = analyzer.analyze_vehicle(vehicle_data_for_ai)
        if result:
            analysis = Analysis(vehicle_id=vehicle.id)
            analysis.decision = result.get('decision', 'À ÉTUDIER')
            analysis.score = int(result.get('score', 50))
            analysis.buy_price = result.get('buy_price')
            analysis.resell_price = result.get('resell_price')
            analysis.estimated_fees = result.get('estimated_fees')
            analysis.net_margin = result.get('net_margin')
            analysis.risk_level = result.get('risk_level', 'Moyen')
            analysis.strengths = result.get('strengths', [])
            analysis.weaknesses = result.get('weaknesses', [])
            analysis.summary = result.get('summary', '')
            db.session.add(analysis)

        vehicle.analyzed_at = datetime.utcnow()
        db.session.commit()
        processed += 1

    return jsonify({'success': True, 'count': processed, 'total_emails': len(emails)})


@app.route('/auth/gmail')
def auth_gmail():
    redirect_uri = url_for('auth_gmail_callback', _external=True)
    flow = gmail_service.get_oauth_flow(redirect_uri)
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
    )
    session['oauth_state'] = state
    return redirect(auth_url)


@app.route('/auth/gmail/callback')
def auth_gmail_callback():
    redirect_uri = url_for('auth_gmail_callback', _external=True)
    flow = gmail_service.get_oauth_flow(redirect_uri)

    try:
        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials

        # Get user email via People API or Gmail profile
        from googleapiclient.discovery import build as g_build
        service = g_build('gmail', 'v1', credentials=credentials)
        profile = service.users().getProfile(userId='me').execute()
        email_address = profile.get('emailAddress', 'unknown@gmail.com')

        gmail_service.save_credentials(credentials, email_address)
        flash(f'Gmail connecté avec succès ({email_address}) !', 'success')
    except Exception as e:
        flash(f'Erreur lors de la connexion Gmail : {e}', 'danger')

    return redirect(url_for('settings'))


@app.route('/auth/status')
def auth_status():
    return jsonify(gmail_service.get_oauth_status())


@app.route('/auth/disconnect', methods=['POST'])
def auth_disconnect():
    gmail_service.disconnect()
    flash('Compte Gmail déconnecté.', 'info')
    return redirect(url_for('settings'))


@app.route('/settings')
def settings():
    oauth_status = gmail_service.get_oauth_status()
    return render_template(
        'settings.html',
        oauth_status=oauth_status,
        anthropic_key_set=bool(os.environ.get('ANTHROPIC_API_KEY')),
        google_id_set=bool(os.environ.get('GOOGLE_CLIENT_ID')),
        google_secret_set=bool(os.environ.get('GOOGLE_CLIENT_SECRET')),
    )


@app.route('/api/stats')
def api_stats():
    from sqlalchemy import func
    total_vehicles = Vehicle.query.count()
    by_decision = {}
    for decision in ['ACHETER', 'À ÉTUDIER', 'REFUSER']:
        by_decision[decision] = Analysis.query.filter_by(decision=decision).count()

    avg_score_row = db.session.query(func.avg(Analysis.score)).scalar()
    avg_score = round(avg_score_row, 1) if avg_score_row else 0

    best_margin_row = db.session.query(func.max(Analysis.net_margin)).scalar()
    best_margin = best_margin_row or 0

    return jsonify({
        'total_vehicles': total_vehicles,
        'by_decision': by_decision,
        'avg_score': avg_score,
        'best_margin': best_margin,
    })


if __name__ == '__main__':
    app.run(debug=os.environ.get('FLASK_ENV') == 'development', port=5000)
