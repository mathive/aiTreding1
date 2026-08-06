"""MT5 Service — connects to MetaTrader 5 for Vantage Markets."""
import MetaTrader5 as mt5
import json, os, time
from datetime import datetime
from typing import Optional

ACCOUNTS_FILE = os.path.join(os.path.dirname(__file__), "mt5_accounts.json")
_connected = False
_current_login: Optional[int] = None

def _load_accounts():
    if os.path.exists(ACCOUNTS_FILE):
        try:
            with open(ACCOUNTS_FILE) as f: return json.load(f)
        except: pass
    return []

def _save_accounts(accounts):
    safe = [{k:v for k,v in a.items() if k!="password"} for a in accounts]
    with open(ACCOUNTS_FILE,"w") as f: json.dump(safe, f, indent=2)

def initialize(login: int, password: str, server: str = "VantageFX-Live"):
    global _connected, _current_login
    if _connected: mt5.shutdown(); _connected = False
    if not mt5.initialize(login=int(login), password=password, server=server):
        return {"success": False, "error": f"MT5 init failed: {mt5.last_error()}"}
    account = mt5.account_info()
    if not account:
        mt5.shutdown(); return {"success": False, "error": "Account info failed"}
    _connected = True; _current_login = int(login)
    stored = _load_accounts()
    existing = next((a for a in stored if a["login"]==int(login) and a["server"]==server), None)
    if existing: existing["last_connected"] = datetime.now().isoformat(); existing["name"] = account.name
    else: stored.append({"login":int(login),"server":server,"name":account.name,"broker":account.company or "Vantage","last_connected":datetime.now().isoformat()})
    _save_accounts(stored)
    return {"success": True, "account": {
        "login": account.login, "name": account.name or "", "server": account.server or "",
        "balance": account.balance, "equity": account.equity, "margin": account.margin,
        "free_margin": account.margin_free, "leverage": account.leverage,
        "currency": account.currency or "", "profit": account.profit,
    }}

def shutdown(): global _connected; _connected = False; mt5.shutdown()

def get_stored_accounts(): return _load_accounts()

def get_account_info():
    if not _connected: return {"error": "MT5 not connected"}
    a = mt5.account_info()
    return {"login":a.login,"name":a.name,"server":a.server,"balance":a.balance,"equity":a.equity,"margin":a.margin,"free_margin":a.margin_free,"leverage":a.leverage,"currency":a.currency,"profit":a.profit}

def get_positions(symbol=None):
    if not _connected: return {"error":"MT5 not connected"}
    pos = mt5.positions_get(symbol=symbol) if symbol else mt5.positions_get()
    if not pos: return []
    return [{"ticket":p.ticket,"symbol":p.symbol,"type":"BUY" if p.type==mt5.ORDER_TYPE_BUY else "SELL","volume":p.volume,"open_price":p.price_open,"current_price":p.price_current,"sl":p.sl,"tp":p.tp,"profit":p.profit,"swap":p.swap,"commission":p.commission,"comment":p.comment,"open_time":str(p.time)} for p in pos]

def get_order_history(days=7):
    if not _connected: return {"error":"MT5 not connected"}
    from_date = int(time.time() - days*86400)
    deals = mt5.history_deals_get(from_date, datetime.now())
    if not deals: return {"deals":[],"orders":[]}
    return {"deals":[{"ticket":d.ticket,"symbol":d.symbol,"type":"BUY" if d.type==mt5.DEAL_TYPE_BUY else "SELL","volume":d.volume,"price":d.price,"profit":d.profit,"time":str(d.time)} for d in deals[:100]]}

def place_order(symbol, order_type, volume, sl=0, tp=0, comment="Nexus AI"):
    if not _connected: return {"error":"MT5 not connected"}
    mt5.symbol_select(symbol, True)
    tick = mt5.symbol_info_tick(symbol)
    if not tick: return {"error":"Symbol not found"}
    price = tick.ask if order_type.upper()=="BUY" else tick.bid
    req = {"action":mt5.TRADE_ACTION_DEAL,"symbol":symbol,"volume":float(volume),"type":mt5.ORDER_TYPE_BUY if order_type.upper()=="BUY" else mt5.ORDER_TYPE_SELL,"price":price,"sl":float(sl) if sl else 0,"tp":float(tp) if tp else 0,"deviation":20,"magic":0,"comment":comment,"type_time":mt5.ORDER_TIME_GTC,"type_filling":mt5.ORDER_FILLING_IOC}
    result = mt5.order_send(req)
    if result.retcode != mt5.TRADE_RETCODE_DONE: return {"error":f"Order failed: {result.comment}"}
    return {"success":True,"ticket":result.order,"symbol":symbol,"volume":volume,"price":result.price}

def close_position(ticket, volume=None):
    if not _connected: return {"error":"MT5 not connected"}
    p = mt5.positions_get(ticket=ticket)
    if not p: return {"error":"Position not found"}
    p = p[0]
    close_type = mt5.ORDER_TYPE_SELL if p.type==mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
    close_price = mt5.symbol_info_tick(p.symbol).bid if close_type==mt5.ORDER_TYPE_SELL else mt5.symbol_info_tick(p.symbol).ask
    req = {"action":mt5.TRADE_ACTION_DEAL,"symbol":p.symbol,"volume":float(volume or p.volume),"type":close_type,"position":ticket,"price":close_price,"deviation":20,"magic":0,"comment":"Nexus AI Close","type_time":mt5.ORDER_TIME_GTC,"type_filling":mt5.ORDER_FILLING_IOC}
    result = mt5.order_send(req)
    if result.retcode != mt5.TRADE_RETCODE_DONE: return {"error":f"Close failed: {result.comment}"}
    return {"success":True,"ticket":ticket,"price":result.price}

def get_tick(symbol):
    if not _connected: return {"error":"MT5 not connected"}
    t = mt5.symbol_info_tick(symbol)
    return {"symbol":symbol,"bid":t.bid,"ask":t.ask,"spread":t.ask-t.bid} if t else {"error":"Symbol not available"}

def get_tick_batch(symbols):
    if not _connected: return {"error":"MT5 not connected"}
    return {s:{"bid":t.bid,"ask":t.ask,"spread":t.ask-t.bid} for s in symbols if (t:=mt5.symbol_info_tick(s))}

def get_symbols():
    if not _connected: return {"error":"MT5 not connected"}
    syms = mt5.symbols_get()
    return [{"name":s.name,"description":s.description} for s in syms[:200]] if syms else []
