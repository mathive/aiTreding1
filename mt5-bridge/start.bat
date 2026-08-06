@echo off
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting MT5 Bridge on http://localhost:8000
echo Make sure MetaTrader 5 is running!
python server.py
