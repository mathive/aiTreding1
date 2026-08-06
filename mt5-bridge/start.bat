@echo off
curl.exe --silent --fail http://127.0.0.1:8000/health >nul 2>&1
if %errorlevel% equ 0 (
  echo MT5 Bridge is already running on http://localhost:8000
  echo Use the existing bridge instance; do not start a second copy.
  exit /b 0
)
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting MT5 Bridge on http://localhost:8000
echo Make sure MetaTrader 5 is running!
python server.py
