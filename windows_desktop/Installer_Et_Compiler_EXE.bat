@echo off
chcp 65001 >nul
title Compilateur d'Exécutable Windows (.EXE) - Ouaga Librairie POS
color 0B

echo =========================================================================
echo    COMPILATEUR D'EXÉCUTABLE WINDOWS (.EXE PORTABLE)
echo    Ouaga Librairie POS - Electron Builder
echo =========================================================================
echo.

cd /d "%~dp0"

echo [1/3] Installation des modules Electron nécessaires...
call npm install electron electron-builder --save-dev

if %errorlevel% neq 0 (
    echo [ERREUR] Échec de l'installation des dépendances.
    pause
    exit /b 1
)

echo.
echo [2/3] Compilation de l'exécutable portable Windows (.exe)...
call npm run build:exe

if %errorlevel% neq 0 (
    echo [ERREUR] Échec de la compilation.
    pause
    exit /b 1
)

echo.
echo =========================================================================
echo    [3/3] SUCCÈS ! Votre exécutable autonome a été généré dans :
echo    %~dp0dist\
echo =========================================================================
pause
exit /b 0
