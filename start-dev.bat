@echo off
cd /d "%~dp0"
echo.
echo  Iniciando servidor local (MIME types correctos para .js)...
echo.
python scripts\dev-server.py %*
if errorlevel 1 (
  echo.
  echo  Error: no se pudo iniciar. Verifica que Python este instalado.
  pause
)
