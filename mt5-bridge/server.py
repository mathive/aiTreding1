"""
MT5 Bridge Server — REST API for Vantage via MetaTrader 5.
Run: python server.py
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
import mt5_service

@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Attach to the account already logged into the local MT5 terminal.
    mt5_service.initialize_existing_terminal()
    yield
    mt5_service.shutdown()

app = FastAPI(title="Nexus MT5 Bridge", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class InitRequest(BaseModel):
    login: int; password: str; server: str = "VantageFX-Live"

class OrderRequest(BaseModel):
    symbol: str; order_type: str; volume: float; sl: float = 0; tp: float = 0; comment: str = "Nexus AI"; allow_duplicate: bool = False

class TickBatchRequest(BaseModel):
    symbols: list[str]

class ModifyRequest(BaseModel):
    sl: float = 0
    tp: float = 0

class CloseRequest(BaseModel):
    volume: Optional[float] = None

@app.get("/health")
def health(): return mt5_service.get_connection_status()

@app.post("/init")
def init(req: InitRequest):
    r = mt5_service.initialize(login=req.login, password=req.password, server=req.server)
    if not r.get("success"): raise HTTPException(400, r.get("error"))
    return r

@app.post("/shutdown")
def shutdown():
    mt5_service.shutdown(); return {"success": True}

@app.get("/accounts")
def list_accounts(): return mt5_service.get_stored_accounts()

@app.get("/account")
def account():
    r = mt5_service.get_account_info()
    if "error" in r: raise HTTPException(400, r["error"])
    return r

@app.get("/positions")
def positions(symbol: Optional[str] = None):
    r = mt5_service.get_positions(symbol)
    if isinstance(r, dict) and "error" in r: raise HTTPException(400, r["error"])
    return r

@app.get("/history")
async def order_history(days: int = 7):
    # MetaTrader's history IPC can return a stale snapshot when invoked from
    # FastAPI's worker thread. Keep it on the lifespan/event-loop thread.
    r = mt5_service.get_order_history(days=days)
    if "error" in r: raise HTTPException(400, r["error"])
    return r

@app.post("/order")
def place_order(req: OrderRequest):
    r = mt5_service.place_order(req.symbol, req.order_type, req.volume, req.sl, req.tp, req.comment, req.allow_duplicate)
    if "error" in r and not r.get("duplicate"): raise HTTPException(400, r["error"])
    return r

@app.post("/close/{ticket}")
def close_pos(ticket: int, req: CloseRequest = CloseRequest()):
    r = mt5_service.close_position(ticket, req.volume)
    if "error" in r: raise HTTPException(400, r["error"])
    return r

@app.patch("/position/{ticket}")
def modify_pos(ticket: int, req: ModifyRequest):
    r = mt5_service.modify_position(ticket, req.sl, req.tp)
    if "error" in r and not r.get("duplicate"): raise HTTPException(400, r["error"])
    return r

@app.get("/tick/{symbol}")
def get_tick(symbol: str):
    r = mt5_service.get_tick(symbol)
    if "error" in r: raise HTTPException(400, r["error"])
    return r

@app.post("/ticks")
def tick_batch(req: TickBatchRequest):
    r = mt5_service.get_tick_batch(req.symbols)
    if isinstance(r, dict) and "error" in r: raise HTTPException(400, r["error"])
    return r

@app.get("/symbols")
def symbols(): return mt5_service.get_symbols()

@app.get("/symbol-info/{symbol}")
def symbol_info(symbol: str):
    r = mt5_service.get_symbol_info(symbol)
    if "error" in r: raise HTTPException(400, r["error"])
    return r

@app.post("/analyses")
def analysis_batch(req: TickBatchRequest):
    r = mt5_service.get_analysis_batch(req.symbols)
    if isinstance(r, dict) and "error" in r: raise HTTPException(400, r["error"])
    return r

@app.get("/candles/{symbol}")
def candles(symbol: str, timeframe: str = "1h", count: int = 100):
    r = mt5_service.get_candles(symbol, timeframe, count)
    if isinstance(r, dict) and "error" in r: raise HTTPException(400, r["error"])
    return r

if __name__ == "__main__":
    import uvicorn
    print("Nexus MT5 Bridge — http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
