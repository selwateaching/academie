@echo off
REM Lancement sans Docker sous Windows (Python 3.11+ requis)
if not exist .venv (python -m venv .venv)
call .venv\Scripts\activate
pip install -q -r requirements.txt
if not exist .env copy .env.example .env
echo Ouvrez http://localhost:8000
uvicorn app.main:app --port 8000
