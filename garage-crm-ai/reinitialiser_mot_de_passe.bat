@echo off
REM Reinitialise le mot de passe d'un utilisateur (vos prospects ne sont pas touches).
cd /d "%~dp0"
if not exist .venv\Scripts\activate (
  echo Lancez d'abord demarrer.bat une fois pour installer l'application.
  pause
  exit /b 1
)
call .venv\Scripts\activate
echo.
echo Fermez d'abord la fenetre noire de l'application si elle est ouverte.
set /p EMAIL=Email de l'utilisateur (ex. admin@garage.local) : 
set /p NEWPW=Nouveau mot de passe (8 caracteres minimum, lettres et chiffres) : 
python -m app.reset_password "%EMAIL%" "%NEWPW%"
echo.
pause
