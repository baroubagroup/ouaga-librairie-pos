@echo off
chcp 65001 >nul
title Caisse & Facturation - Librairie Papeterie Ouagadougou
color 1F

echo =========================================================================
echo    LIBRAIRIE PAPETERIE OUAGADOUGOU - SYSTÈME DE CAISSE & FACTURATION
echo    Mode : 100%% Hors-Ligne (Autonomie Totale / Anti-Délestage Sonabel)
echo =========================================================================
echo.

cd /d "%~dp0"

:: 1. Vérification de Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas détecté sur cet ordinateur.
    echo Veuillez installer Node.js depuis https://nodejs.org pour exécuter la caisse.
    pause
    exit /b 1
)

:: 2. Démarrage du serveur local hors-ligne en tâche de fond (s'il n'est pas déjà actif)
netstat -ano | findstr :3500 >nul 2>nul
if %errorlevel% neq 0 (
    echo [1/2] Démarrage du moteur de base de données locale (Port 3500)...
    start /b "" node server.js
    timeout /t 2 /nobreak >nul
) else (
    echo [1/2] Moteur local de caisse déjà actif sur le port 3500.
)

:: 3. Lancement de l'interface bureau
echo [2/2] Ouverture de la fenêtre de caisse...

:: Si Electron est installé, on l'utilise pour la fenêtre native
if exist "node_modules\electron" (
    start "" npx electron .
    goto :FIN
)

:: Sinon, lancement en mode Application Dédiée plein écran (Edge ou Chrome sans barre d'adresse)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3500 --window-size=1280,850
    goto :FIN
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3500 --window-size=1280,850
    goto :FIN
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3500 --window-size=1280,850
    goto :FIN
)

:: En dernier recours, navigateur par défaut
start http://localhost:3500

:FIN
echo.
echo =========================================================================
echo    Caisse prête et connectée en local (http://localhost:3500)
echo    Pour arrêter le système, fermez simplement cette fenêtre ou l'application.
echo =========================================================================
exit /b 0
