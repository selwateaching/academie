FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render fournit PORT (10000 par défaut). Un seul worker : il envoie aussi les rappels.
EXPOSE 10000
CMD ["sh", "-c", "gunicorn wsgi:app --workers 1 --threads 8 --timeout 120 --bind 0.0.0.0:${PORT:-10000} --access-logfile -"]
