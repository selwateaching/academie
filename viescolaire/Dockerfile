# Construire depuis la racine du dépôt :  docker build -f viescolaire/Dockerfile -t viescolairepro .
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 VSP_DATA=/data PORT=8000
WORKDIR /app
COPY viescolaire/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY viescolaire /app/viescolaire
RUN useradd -m app && mkdir /data && chown app /data
USER app
VOLUME /data
EXPOSE 8000
# Démo : -e VSP_DEMO=1   |   Production : créer un compte avec la commande create-admin (voir README)
CMD ["sh", "-c", "gunicorn viescolaire.app:app --workers 1 --threads 8 --bind 0.0.0.0:${PORT}"]
