import re
from html.parser import HTMLParser


# Known source domains/keywords
SOURCE_PATTERNS = {
    'BCA': ['bca-auction', 'bca.com', 'bca auction', 'bca-auction.fr'],
    'AUTO1': ['auto1.com', 'auto1group', '@auto1', 'auto1'],
    'LeBonCoin': ['leboncoin.fr', 'leboncoin', 'le bon coin'],
}

BRANDS = [
    'Peugeot', 'Renault', 'Citroën', 'Citroen', 'Volkswagen', 'VW', 'BMW', 'Mercedes',
    'Audi', 'Toyota', 'Ford', 'Opel', 'Fiat', 'Nissan', 'Hyundai', 'Kia', 'Skoda',
    'Seat', 'Volvo', 'Honda', 'Mazda', 'Mitsubishi', 'Suzuki', 'Dacia', 'Alfa Romeo',
    'Jeep', 'Land Rover', 'Jaguar', 'Porsche', 'Tesla', 'Lexus', 'Subaru', 'Chevrolet',
    'Dodge', 'Chrysler', 'Mini', 'Smart', 'Lancia', 'Maserati', 'Ferrari', 'Lamborghini',
    'Aston Martin', 'Bentley', 'Rolls Royce', 'DS', 'Cupra', 'MG', 'BYD',
]

MODELS_BY_BRAND = {
    'Peugeot': ['208', '308', '508', '2008', '3008', '5008', '408', 'Partner', 'Expert', 'Boxer'],
    'Renault': ['Clio', 'Megane', 'Laguna', 'Scenic', 'Kadjar', 'Captur', 'Twingo', 'Zoe', 'Trafic', 'Master', 'Arkana', 'Austral'],
    'Citroën': ['C3', 'C4', 'C5', 'Berlingo', 'Jumpy', 'Jumper', 'C-Elysée', 'DS3', 'DS4', 'DS5'],
    'Volkswagen': ['Golf', 'Polo', 'Passat', 'Tiguan', 'T-Roc', 'T-Cross', 'Touareg', 'Arteon', 'Sharan', 'Transporter', 'Crafter', 'Caddy'],
    'BMW': ['116', '118', '120', '316', '318', '320', '330', '418', '420', '520', '530', 'X1', 'X3', 'X5', 'X6', 'Serie 1', 'Serie 3', 'Serie 5'],
    'Mercedes': ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'GLA', 'GLC', 'GLE', 'Sprinter', 'Vito', 'CLA'],
    'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'TT', 'RS3', 'RS4'],
    'Toyota': ['Yaris', 'Corolla', 'Auris', 'Prius', 'RAV4', 'CH-R', 'Aygo', 'Hilux', 'ProAce'],
    'Ford': ['Fiesta', 'Focus', 'Mondeo', 'Kuga', 'Puma', 'EcoSport', 'Ranger', 'Transit', 'Custom'],
    'Opel': ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Zafira', 'Vivaro', 'Movano'],
    'Dacia': ['Sandero', 'Logan', 'Duster', 'Spring', 'Lodgy', 'Dokker'],
    'Fiat': ['500', 'Panda', 'Tipo', 'Punto', 'Ducato', 'Doblo', 'Bravo'],
    'Hyundai': ['i20', 'i30', 'Tucson', 'Santa Fe', 'Kona', 'Ioniq'],
    'Kia': ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Sorento', 'Stonic', 'Niro', 'EV6'],
    'Skoda': ['Fabia', 'Octavia', 'Superb', 'Karoq', 'Kodiaq', 'Scala', 'Kamiq'],
}

VEHICLE_KEYWORDS = [
    'voiture', 'véhicule', 'vehicule', 'auto', 'berline', 'break', 'suv', 'monospace',
    'cabriolet', 'coupe', 'coupé', 'utilitaire', 'fourgon', 'fourgonnette', 'camionnette',
    'km', 'kilométrage', 'kilometrage', 'diesel', 'essence', 'hybride', 'electrique', 'électrique',
    'boite auto', 'boîte auto', 'automatique', 'manuelle', 'cv', 'chevaux', 'cylindrée',
    'mise en vente', 'à vendre', 'vente', 'prix', 'offre', 'enchère', 'enchere',
    'ct ok', 'controle technique', 'contrôle technique', 'première main', 'premiere main',
]

CITY_PATTERNS = [
    r'\b(Paris|Lyon|Marseille|Toulouse|Nice|Nantes|Strasbourg|Montpellier|Bordeaux|Lille|Rennes|'
    r'Reims|Saint-Étienne|Le Havre|Toulon|Grenoble|Dijon|Angers|Nîmes|Villeurbanne|'
    r'Le Mans|Aix-en-Provence|Clermont-Ferrand|Brest|Tours|Amiens|Limoges|Annecy|'
    r'Perpignan|Besançon|Orléans|Metz|Rouen|Mulhouse|Caen|Boulogne-Billancourt|Nancy|'
    r'Argenteuil|Saint-Denis|Roubaix|Tourcoing|Montreuil|Avignon|Asnieres-sur-Seine|'
    r'Versailles|Nanterre|Créteil|Pau|Poitiers|Courbevoie|Vitry-sur-Seine|La Rochelle|'
    r'Colombes|Aulnay-sous-Bois|Asnières|Rueil-Malmaison|Saint-Pierre|Champigny-sur-Marne|'
    r'Antibes|Béziers|Dunkerque|Mérignac|Ajaccio|Saint-Maur-des-Fossés|Calais|Drancy)\b',
]


class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []

    def handle_data(self, data):
        self.text_parts.append(data)

    def get_text(self):
        return ' '.join(self.text_parts)


def html_to_text(html):
    parser = HTMLTextExtractor()
    try:
        parser.feed(html)
        return parser.get_text()
    except Exception:
        return html


def detect_source(email):
    sender = email.get('from', '').lower()
    subject = email.get('subject', '').lower()
    combined = sender + ' ' + subject

    for source, patterns in SOURCE_PATTERNS.items():
        for pattern in patterns:
            if pattern.lower() in combined:
                return source

    return 'Particulier'


def extract_vehicle_data(email):
    subject = email.get('subject', '') or ''
    body_plain = email.get('body_plain', '') or ''
    body_html = email.get('body_html', '') or ''

    if not body_plain and body_html:
        body_plain = html_to_text(body_html)

    full_text = f"{subject} {body_plain}"

    result = {
        'brand': None,
        'model': None,
        'year': None,
        'km': None,
        'price_asked': None,
        'motorization': None,
        'location': None,
    }

    # Brand detection
    for brand in BRANDS:
        if re.search(r'\b' + re.escape(brand) + r'\b', full_text, re.IGNORECASE):
            result['brand'] = brand

            # Model detection for that brand
            if brand in MODELS_BY_BRAND:
                for model in MODELS_BY_BRAND[brand]:
                    if re.search(r'\b' + re.escape(model) + r'\b', full_text, re.IGNORECASE):
                        result['model'] = model
                        break
            break

    # If no model found via brand dict, try generic model from subject (word after brand)
    if result['brand'] and not result['model']:
        brand_idx = full_text.lower().find(result['brand'].lower())
        if brand_idx != -1:
            rest = full_text[brand_idx + len(result['brand']):].strip()
            m = re.match(r'\s+(\w[\w\s-]{1,30}?)(?:\s+\d{4}|\s+\d+\s*km|\s*[-,|]|$)', rest, re.IGNORECASE)
            if m:
                result['model'] = m.group(1).strip()

    # Year (4-digit year between 1990 and 2030)
    years = re.findall(r'\b((?:19[9]\d|20[012]\d))\b', full_text)
    if years:
        result['year'] = int(years[0])

    # Kilometres
    km_patterns = [
        r'(\d[\d\s]{1,7})\s*km\b',
        r'(\d[\d\s]{1,7})\s*kilomètre',
        r'(\d[\d\s]{1,7})\s*kilometre',
        r'kilométrage\s*:?\s*(\d[\d\s]{1,7})',
    ]
    for pattern in km_patterns:
        m = re.search(pattern, full_text, re.IGNORECASE)
        if m:
            km_str = re.sub(r'\s', '', m.group(1))
            try:
                km_val = int(km_str)
                if 100 <= km_val <= 1000000:
                    result['km'] = km_val
                    break
            except ValueError:
                pass

    # Price
    price_patterns = [
        r'(\d[\d\s]{1,8})\s*€',
        r'(\d[\d\s]{1,8})\s*EUR\b',
        r'prix\s*:?\s*(\d[\d\s]{1,8})',
        r'(\d[\d\s]{1,8})\s*euros?',
    ]
    for pattern in price_patterns:
        m = re.search(pattern, full_text, re.IGNORECASE)
        if m:
            price_str = re.sub(r'\s', '', m.group(1))
            try:
                price_val = float(price_str)
                if 500 <= price_val <= 500000:
                    result['price_asked'] = price_val
                    break
            except ValueError:
                pass

    # Motorization
    motorization_map = {
        'Électrique': [r'\bélectrique\b', r'\belectrique\b', r'\bBEV\b', r'\bEV\b'],
        'Hybride': [r'\bhybride\b', r'\bhybrid\b', r'\bHEV\b', r'\bPHEV\b', r'\bmild.hybrid\b'],
        'Diesel': [r'\bdiesel\b', r'\bgazole\b', r'\bHDi\b', r'\bTDI\b', r'\bCDTI\b', r'\bdCi\b', r'\bBlueHDi\b', r'\bCRDi\b'],
        'Essence': [r'\bessence\b', r'\bTSI\b', r'\bGTi\b', r'\bVTi\b', r'\bTCe\b', r'\bTFSI\b', r'\bPureTech\b'],
    }
    for moto, patterns in motorization_map.items():
        for pat in patterns:
            if re.search(pat, full_text, re.IGNORECASE):
                result['motorization'] = moto
                break
        if result['motorization']:
            break

    # Location
    for pattern in CITY_PATTERNS:
        m = re.search(pattern, full_text, re.IGNORECASE)
        if m:
            result['location'] = m.group(0)
            break

    return result


def is_vehicle_announcement(email):
    subject = (email.get('subject', '') or '').lower()
    body_plain = (email.get('body_plain', '') or '').lower()
    body_html = (email.get('body_html', '') or '').lower()

    if not body_plain and body_html:
        body_plain = html_to_text(body_html).lower()

    combined = f"{subject} {body_plain[:2000]}"

    # Check source first
    source = detect_source(email)
    if source in ('BCA', 'AUTO1', 'LeBonCoin'):
        return True

    # Check for brand mentions
    for brand in BRANDS:
        if brand.lower() in combined:
            keyword_count = sum(1 for kw in VEHICLE_KEYWORDS if kw in combined)
            if keyword_count >= 2:
                return True

    # Check for generic vehicle keywords
    keyword_count = sum(1 for kw in VEHICLE_KEYWORDS if kw in combined)
    if keyword_count >= 3:
        return True

    return False
