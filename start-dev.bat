@echo off
cd /d "%~dp0"
echo.
echo  ========================================================
echo   CODEVS IA - Servidor local
echo   NO uses: python -m http.server  (rompe los .js en Windows)
echo  ========================================================
echo.
set PORT=8080
if not "%~1"=="" set PORT=%~1
python scripts\dev-server.py %PORT%
if errorlevel 1 (
  echo.
  echo  Error: no se pudo iniciar. Verifica que Python este instalado.
  pause
)
