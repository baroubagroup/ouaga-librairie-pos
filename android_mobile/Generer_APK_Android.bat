@echo off
chcp 65001 >nul
title Compilateur APK Android - Ouaga Librairie POS
color 0A

echo =========================================================================
echo    GÉNÉRATEUR D'APPLICATION MOBILE ANDROID (.APK)
echo    Ouaga Librairie POS Mobile (100%% Hors-Ligne & Sync PC)
echo =========================================================================
echo.

cd /d "%~dp0"

where flutter >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Flutter n'est pas détecté dans les variables d'environnement.
    echo Veuillez vérifier l'installation de Flutter SDK.
    pause
    exit /b 1
)

echo [1/2] Récupération des dépendances Flutter...
call flutter pub get

echo.
echo [2/2] Compilation de l'APK Release pour Android...
call flutter build apk --release

if %errorlevel% neq 0 (
    echo [ERREUR] La compilation a échoué.
    pause
    exit /b 1
)

echo.
echo =========================================================================
echo    SUCCÈS ! Votre fichier APK Android a été généré avec succès dans :
echo    %~dp0build\app\outputs\flutter-apk\app-release.apk
echo.
echo    Vous pouvez transférer ce fichier APK sur vos smartphones Android
echo    et l'installer pour gérer la caisse même en plein délestage Sonabel.
echo =========================================================================
pause
exit /b 0
