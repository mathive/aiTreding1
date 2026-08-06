"""MT5 Service — connects to MetaTrader 5 for Vantage Markets."""
import MetaTrader5 as mt5
import json, os, subprocess, sys, threading, time
from datetime import datetime, timedelta, timezone
from typing import Optional

ACCOUNTS_FILE = os.path.join(os.path.dirname(__file__), "mt5_accounts.json")
_connected = False
_current_login: Optional[int] = None
_lock = threading.RLock()
_analysis_cache = {}
_history_cache = {"key": None, "expires": 0.0, "payload": None}

def _last_error(prefix):
    return f"{prefix}: {mt5.last_error()}"

def _connected_now():
    return _connected and mt5.terminal_info() is not None and mt5.account_info() is not None

def get_connection_status():
    connected = _connected_now()
    return {"status": "ok", "connected": connected, "login": _current_login if connected else None}

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

def initialize_existing_terminal():
    """Attach to the account already logged into the local MT5 terminal."""
    global _connected, _current_login
    with _lock:
        if not mt5.initialize():
            return {"success": False, "error": _last_error("MT5 terminal attach failed")}
        account = mt5.account_info()
        if account is None:
            mt5.shutdown()
            return {"success": False, "error": _last_error("No account logged into MT5 terminal")}
        _connected = True
        _current_login = int(account.login)
        return {"success": True, "login": _current_login, "server": account.server}

def shutdown(): global _connected; _connected = False; mt5.shutdown()

def get_stored_accounts(): return _load_accounts()

def get_account_info():
    if not _connected_now(): return {"error": "MT5 not connected"}
    a = mt5.account_info()
    if a is None: return {"error": _last_error("Account info failed")}
    return {"login":a.login,"name":a.name,"server":a.server,"balance":a.balance,"equity":a.equity,"margin":a.margin,"free_margin":a.margin_free,"leverage":a.leverage,"currency":a.currency,"profit":a.profit}

def get_positions(symbol=None):
    if not _connected_now(): return {"error":"MT5 not connected"}
    pos = mt5.positions_get(symbol=symbol) if symbol else mt5.positions_get()
    if pos is None: return {"error":_last_error("Positions request failed")}
    return [{"ticket":p.ticket,"symbol":p.symbol,"type":"BUY" if p.type==mt5.POSITION_TYPE_BUY else "SELL","volume":p.volume,"open_price":p.price_open,"current_price":p.price_current,"sl":p.sl,"tp":p.tp,"profit":p.profit,"swap":p.swap,"comment":p.comment,"open_time":datetime.fromtimestamp(p.time, timezone.utc).isoformat()} for p in pos]

def get_order_history(days=7):
    if not _connected_now(): return {"error":"MT5 not connected"}
    days = max(1, min(int(days), 3650))
    cache_key = (int(_current_login or 0), days)
    if _history_cache["key"] == cache_key and time.monotonic() < _history_cache["expires"]:
        return _history_cache["payload"]
    # MT5 may keep stale deal history in a long-lived IPC client even while
    # positions and quotes remain live. An isolated short-lived client forces
    # the terminal to provide its current deal ledger.
    helper = os.path.join(os.path.dirname(__file__), "history_snapshot.py")
    try:
        flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        snapshot = subprocess.run([sys.executable, helper, str(days)], capture_output=True, text=True, timeout=20, creationflags=flags)
        if snapshot.returncode == 0:
            payload = json.loads(snapshot.stdout)
            if (int(payload.get("login", 0)) == int(_current_login or 0)
                    and isinstance(payload.get("deals"), list) and isinstance(payload.get("orders"), list)):
                result = {"deals":payload["deals"], "orders":payload["orders"]}
                _history_cache.update({"key":cache_key, "expires":time.monotonic()+30.0, "payload":result})
                return result
    except (subprocess.SubprocessError, OSError, ValueError, json.JSONDecodeError):
        pass
    end = datetime.now(timezone.utc); start = end - timedelta(days=days)
    # Reattach before reading history. The MT5 Python IPC session can keep a
    # stale history snapshot while quotes/positions continue updating.
    with _lock:
        if not mt5.initialize(): return {"error":_last_error("MT5 history refresh failed")}
        account = mt5.account_info()
        if account is None or (_current_login and int(account.login) != int(_current_login)):
            return {"error":"MT5 history refresh attached to the wrong account"}
        deals = mt5.history_deals_get(start, end)
        orders = mt5.history_orders_get(start, end)
    if deals is None or orders is None: return {"error":_last_error("History request failed")}
    result = {
        "deals":[{"ticket":d.ticket,"order":d.order,"position_id":d.position_id,"symbol":d.symbol,"type":"BUY" if d.type==mt5.DEAL_TYPE_BUY else "SELL","entry":d.entry,"volume":d.volume,"price":d.price,"profit":d.profit,"commission":d.commission,"swap":d.swap,"magic":d.magic,"comment":d.comment,"time":datetime.fromtimestamp(d.time, timezone.utc).isoformat()} for d in reversed(deals[-500:])],
        "orders":[{"ticket":o.ticket,"symbol":o.symbol,"type":o.type,"state":o.state,"volume_initial":o.volume_initial,"volume_current":o.volume_current,"price_open":o.price_open,"sl":o.sl,"tp":o.tp,"time_setup":datetime.fromtimestamp(o.time_setup, timezone.utc).isoformat()} for o in reversed(orders[-500:])]
    }
    _history_cache.update({"key":cache_key, "expires":time.monotonic()+30.0, "payload":result})
    return result

def _valid_volume(si, volume):
    volume = float(volume)
    if volume < si.volume_min or volume > si.volume_max: return None
    steps = round((volume - si.volume_min) / si.volume_step)
    normalized = si.volume_min + steps * si.volume_step
    if abs(normalized - volume) > max(1e-9, si.volume_step / 1000): return None
    return round(normalized, 8)

def _send_with_fillings(request, si):
    fillings = [si.filling_mode, mt5.ORDER_FILLING_IOC, mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_RETURN]
    seen = set(); last = None
    for filling in fillings:
        if filling in seen: continue
        seen.add(filling); request["type_filling"] = filling
        last = mt5.order_send(request)
        if last and last.retcode in (mt5.TRADE_RETCODE_DONE, mt5.TRADE_RETCODE_DONE_PARTIAL): return last
        if last and last.retcode not in (mt5.TRADE_RETCODE_INVALID_FILL,): break
    return last

def _find_duplicate(symbol, order_type):
    wanted = mt5.POSITION_TYPE_BUY if order_type == "BUY" else mt5.POSITION_TYPE_SELL
    positions = mt5.positions_get(symbol=symbol)
    if positions:
        match = next((p for p in positions if p.type == wanted), None)
        if match: return {"kind":"position", "ticket":match.ticket, "volume":match.volume, "price":match.price_open}
    pending_types = ({mt5.ORDER_TYPE_BUY_LIMIT, mt5.ORDER_TYPE_BUY_STOP, mt5.ORDER_TYPE_BUY_STOP_LIMIT}
                     if order_type == "BUY" else
                     {mt5.ORDER_TYPE_SELL_LIMIT, mt5.ORDER_TYPE_SELL_STOP, mt5.ORDER_TYPE_SELL_STOP_LIMIT})
    orders = mt5.orders_get(symbol=symbol)
    if orders:
        match = next((o for o in orders if o.type in pending_types), None)
        if match: return {"kind":"pending_order", "ticket":match.ticket, "volume":match.volume_current or match.volume_initial, "price":match.price_open}
    return None

def place_order(symbol, order_type, volume, sl=0, tp=0, comment="Nexus AI", allow_duplicate=False):
    if not _connected_now(): return {"error":"MT5 not connected"}
    order_type = order_type.upper()
    if order_type not in ("BUY", "SELL"): return {"error":"order_type must be BUY or SELL"}
    if not mt5.symbol_select(symbol, True): return {"error":_last_error("Unable to select symbol")}
    with _lock:
        if not allow_duplicate:
            existing = _find_duplicate(symbol, order_type)
            if existing:
                return {"success":False,"duplicate":True,"skipped":True,"symbol":symbol,"order_type":order_type,"existing":existing,"error":f"{order_type} on {symbol} is already active"}
        si = mt5.symbol_info(symbol); tick = mt5.symbol_info_tick(symbol)
        if not tick: return {"error":"Symbol not found"}
        if not si or si.trade_mode == mt5.SYMBOL_TRADE_MODE_DISABLED: return {"error":"Trading is disabled for this symbol"}
        volume = _valid_volume(si, volume)
        if volume is None: return {"error":f"Invalid volume. Allowed {si.volume_min} to {si.volume_max}, step {si.volume_step}"}
        price = tick.ask if order_type=="BUY" else tick.bid
        sl=float(sl or 0)
        # Every new position uses an exact 3:1 reward-to-risk ratio. If the
        # caller omitted SL, use a conservative 0.2% M1 fallback risk.
        if not sl: sl = price * (0.998 if order_type=="BUY" else 1.002)
        risk_distance = abs(price-sl)
        tp = price + 3*risk_distance if order_type=="BUY" else price - 3*risk_distance
        sl=round(sl, si.digits); tp=round(tp, si.digits)
        if (order_type=="BUY" and ((sl and sl>=price) or (tp and tp<=price))) or (order_type=="SELL" and ((sl and sl<=price) or (tp and tp>=price))): return {"error":"SL/TP are on the wrong side of the market price"}
        req = {"action":mt5.TRADE_ACTION_DEAL,"symbol":symbol,"volume":volume,"type":mt5.ORDER_TYPE_BUY if order_type=="BUY" else mt5.ORDER_TYPE_SELL,"price":price,"sl":sl,"tp":tp,"deviation":20,"magic":260806,"comment":comment[:31],"type_time":mt5.ORDER_TIME_GTC}
        result = _send_with_fillings(req, si)
    if not result: return {"error":_last_error("Order send failed")}
    if result.retcode not in (mt5.TRADE_RETCODE_DONE, mt5.TRADE_RETCODE_DONE_PARTIAL): return {"error":f"Order failed ({result.retcode}): {result.comment}"}
    return {"success":True,"ticket":result.order or result.deal,"deal":result.deal,"symbol":symbol,"volume":result.volume,"price":result.price,"sl":sl,"tp":tp,"risk_reward":"1:3","retcode":result.retcode}

def close_position(ticket, volume=None):
    if not _connected_now(): return {"error":"MT5 not connected"}
    p = mt5.positions_get(ticket=ticket)
    if not p: return {"error":"Position not found"}
    p = p[0]
    close_type = mt5.ORDER_TYPE_SELL if p.type==mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
    si=mt5.symbol_info(p.symbol); tick=mt5.symbol_info_tick(p.symbol)
    if not si or not tick: return {"error":"No live quote for position symbol"}
    close_volume=_valid_volume(si, volume or p.volume)
    if close_volume is None or close_volume > p.volume: return {"error":f"Invalid close volume; position volume is {p.volume}"}
    close_price = tick.bid if close_type==mt5.ORDER_TYPE_SELL else tick.ask
    req = {"action":mt5.TRADE_ACTION_DEAL,"symbol":p.symbol,"volume":close_volume,"type":close_type,"position":ticket,"price":close_price,"deviation":20,"magic":260806,"comment":"Nexus AI Close","type_time":mt5.ORDER_TIME_GTC}
    with _lock: result = _send_with_fillings(req, si)
    if not result: return {"error":_last_error("Close send failed")}
    if result.retcode not in (mt5.TRADE_RETCODE_DONE, mt5.TRADE_RETCODE_DONE_PARTIAL): return {"error":f"Close failed ({result.retcode}): {result.comment}"}
    return {"success":True,"ticket":ticket,"price":result.price}

def modify_position(ticket, sl=0, tp=0):
    if not _connected_now(): return {"error":"MT5 not connected"}
    positions=mt5.positions_get(ticket=ticket)
    if not positions: return {"error":"Position not found"}
    p=positions[0]; tick=mt5.symbol_info_tick(p.symbol)
    if not tick: return {"error":"No live quote for position symbol"}
    sl=float(sl or 0); tp=float(tp or 0); price=tick.bid if p.type==mt5.POSITION_TYPE_BUY else tick.ask
    if (p.type==mt5.POSITION_TYPE_BUY and ((sl and sl>=price) or (tp and tp<=price))) or (p.type==mt5.POSITION_TYPE_SELL and ((sl and sl<=price) or (tp and tp>=price))): return {"error":"SL/TP are on the wrong side of the market price"}
    result=mt5.order_send({"action":mt5.TRADE_ACTION_SLTP,"position":ticket,"symbol":p.symbol,"sl":sl,"tp":tp,"magic":260806})
    if not result or result.retcode != mt5.TRADE_RETCODE_DONE: return {"error":f"Modify failed: {getattr(result, 'comment', mt5.last_error())}"}
    return {"success":True,"ticket":ticket,"sl":sl,"tp":tp}

def get_tick(symbol):
    if not _connected: return {"error":"MT5 not connected"}
    t = mt5.symbol_info_tick(symbol)
    return {"symbol":symbol,"bid":t.bid,"ask":t.ask,"spread":t.ask-t.bid} if t else {"error":"Symbol not available"}

def get_tick_batch(symbols):
    if not _connected: return {"error":"MT5 not connected"}
    return {s:{"bid":t.bid,"ask":t.ask,"spread":t.ask-t.bid} for s in symbols if (t:=mt5.symbol_info_tick(s))}

def _ema(values, period):
    if not values: return 0.0
    multiplier = 2.0 / (period + 1.0)
    result = float(values[0])
    for value in values[1:]: result = (float(value) - result) * multiplier + result
    return result

def _rsi(values, period=14):
    if len(values) <= period: return 50.0
    changes = [float(values[i]) - float(values[i-1]) for i in range(1, len(values))]
    sample = changes[-period:]
    gains = sum(max(change, 0) for change in sample) / period
    losses = sum(max(-change, 0) for change in sample) / period
    if losses == 0: return 100.0 if gains > 0 else 50.0
    return 100.0 - (100.0 / (1.0 + gains / losses))

def get_market_analysis(symbol):
    if not _connected_now(): return {"error":"MT5 not connected"}
    # Signals use completed candles only and are cached by closed M1 candle.
    latest = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M1, 1, 1)
    if latest is None or len(latest) == 0: return {"error":"No completed M1 candle"}
    cache_key = (int(_current_login or 0), symbol, int(latest[-1]["time"]))
    cached = _analysis_cache.get(cache_key)
    if cached is not None: return cached
    def load(tf, count=260):
        rows = mt5.copy_rates_from_pos(symbol, tf, 1, count)
        if rows is None or len(rows) < 60: return None
        return {"rows":rows,"c":[float(x["close"]) for x in rows],"h":[float(x["high"]) for x in rows],
                "l":[float(x["low"]) for x in rows],"o":[float(x["open"]) for x in rows],"v":[float(x["tick_volume"]) for x in rows]}
    m1=load(mt5.TIMEFRAME_M1); m5=load(mt5.TIMEFRAME_M5); m15=load(mt5.TIMEFRAME_M15); h1=load(mt5.TIMEFRAME_H1)
    if not all((m1,m5,m15,h1)): return {"error":"Insufficient multi-timeframe candle history"}
    def atr(data, period=14):
        c,h,l=data["c"],data["h"],data["l"]
        values=[max(h[i]-l[i],abs(h[i]-c[i-1]),abs(l[i]-c[i-1])) for i in range(max(1,len(c)-period),len(c))]
        return sum(values)/max(1,len(values))
    def macd_direction(data):
        c=data["c"]; series=[_ema(c[:i],12)-_ema(c[:i],26) for i in range(26,len(c)+1)]
        return ("BUY" if series[-1]>=_ema(series,9) else "SELL", abs(series[-1]-_ema(series,9)))
    def strength(delta, unit, base=58): return base+min(37,abs(delta)/max(unit,1e-12)*18)
    now=datetime.fromtimestamp(cache_key[2],timezone.utc); utc=now.hour+now.minute/60
    london=7<=utc<16; london_open=7<=utc<10; ny=12.5<=utc<21; ny_open=12.5<=utc<15; overlap=12.5<=utc<16; asian=0<=utc<9
    base=symbol.upper().replace("/",""); current=m1["c"][-1]; atr1=atr(m1); atr5=atr(m5); rsi1=_rsi(m1["c"],14)
    strategy_signals=[]
    def add(name,family,asset,timeframe,trading_time,direction,confidence,session=True,details=""):
        if not base.startswith(asset): return
        strategy_signals.append({"name":name,"family":family,"bestAsset":asset,"timeframe":timeframe,"tradingTime":trading_time,
            "direction":direction,"confidence":round(max(0,min(95,confidence if session else min(confidence,59)))),"sessionActive":bool(session),"details":details})
    def breakout(data,period):
        high=max(data["h"][-period-1:-1]); low=min(data["l"][-period-1:-1]); price=data["c"][-1]
        direction="BUY" if price>high else "SELL" if price<low else "BUY" if price>sum(data["c"][-period:])/period else "SELL"
        return direction, strength(price-(high if direction=="BUY" else low),atr(data))
    def trend(data,fast,slow):
        a=_ema(data["c"],fast); b=_ema(data["c"],slow); return ("BUY" if a>=b else "SELL",strength(a-b,atr(data)))

    volume_ratio=m1["v"][-1]/max(1,sum(m1["v"][-21:-1])/20)
    d,cf=breakout(m1,60); add("London Breakout","breakout","GBPUSD","M1-M5","07:00-10:00 UTC",d,cf+(8 if volume_ratio>=1.2 else 0),london_open,"Session range breakout + volume filter")
    d,cf=breakout(m1,90); add("New York Breakout","breakout","EURUSD","M1-M5","12:30-15:00 UTC",d,cf,ny_open)
    d,cf=trend(m1,9,20); add("London-New York Overlap Scalping","scalping","EURUSD","M1","12:30-16:00 UTC",d,cf,overlap)
    prior_high=max(m1["h"][-21:-1]); prior_low=min(m1["l"][-21:-1]); bos="BUY" if current>prior_high else "SELL" if current<prior_low else ("BUY" if current>_ema(m1["c"],20) else "SELL")
    ob_sweep=(m1["l"][-1]<prior_low and bos=="BUY") or (m1["h"][-1]>prior_high and bos=="SELL")
    add("Order Block + BOS","smc","GBPUSD","M1-M15","London & New York",bos,strength(current-(prior_high if bos=="BUY" else prior_low),atr1)+(10 if ob_sweep else 0),london or ny,"Order block + structure break + liquidity check")
    swept_high=m1["h"][-1]>max(m1["h"][-21:-1]) and current<max(m1["h"][-21:-1]); swept_low=m1["l"][-1]<min(m1["l"][-21:-1]) and current>min(m1["l"][-21:-1])
    sweep_dir="SELL" if swept_high else "BUY" if swept_low else ("BUY" if current>_ema(m1["c"],20) else "SELL")
    add("Liquidity Sweep (ICT/SMC)","smc","EURUSD","M1-M5","London Open",sweep_dir,88 if swept_high or swept_low else 61,london_open)
    bull_fvg=m1["l"][-1]>m1["h"][-3]; bear_fvg=m1["h"][-1]<m1["l"][-3]; fvg_dir="BUY" if bull_fvg else "SELL" if bear_fvg else ("BUY" if current>_ema(m1["c"],20) else "SELL")
    fvg_bos=(fvg_dir=="BUY" and current>prior_high) or (fvg_dir=="SELL" and current<prior_low)
    add("Fair Value Gap (FVG)","smc","EURUSD","M1-M5","London & New York",fvg_dir,(90 if fvg_bos else 82) if bull_fvg or bear_fvg else 62,london or ny,"FVG + market structure break")
    d,cf=trend(m5,20,50); pullback=abs(m5["c"][-1]-_ema(m5["c"],20))<=atr5; add("EMA 20/50 Pullback","trend","EURUSD","M5","Any trending session",d,cf+8 if pullback else cf,london or ny)
    d,cf=trend(m1,20,200); add("EMA 200 Trend Scalping","trend","USDJPY","M1","Tokyo & London",d,cf,asian or london)
    d,cf=trend(m1,10,30); ema200_dir="BUY" if current>=_ema(m1["c"],200) else "SELL"; atr_expanding=atr(m1,5)>=atr1
    add("Supertrend Scalping","trend","XAUUSD","M1","London",d,cf+(10 if d==ema200_dir else -8)+(7 if atr_expanding else 0),london,"EMA 200 + Supertrend direction + ATR expansion")
    typical=[(m1["h"][i]+m1["l"][i]+m1["c"][i])/3 for i in range(-120,0)]; vols=m1["v"][-120:]; vwap=sum(p*v for p,v in zip(typical,vols))/max(1,sum(vols)); vwdir="BUY" if current<vwap else "SELL"
    add("VWAP Reversal","reversion","XAUUSD","M1","New York Open",vwdir,strength(current-vwap,atr1)+(8 if volume_ratio>=1.2 else 0),ny_open,"VWAP reversal + tick-volume confirmation")
    mid=sum(m5["c"][-20:])/20; dev=(sum((x-mid)**2 for x in m5["c"][-20:])/20)**0.5; bbdir="SELL" if m5["c"][-1]>mid else "BUY"
    add("Bollinger Band Reversal","reversion","EURUSD","M5","Asian Session",bbdir,58+min(37,abs(m5["c"][-1]-mid)/max(dev,1e-12)*15),asian)
    audtrend="BUY" if m15["c"][-1]>_ema(m15["c"],50) else "SELL"; add("RSI Hidden Divergence","momentum","AUDUSD","M5-M15","London",audtrend,60+min(35,abs(_rsi(m5["c"],14)-50)*1.2),london)
    d,delta=macd_direction(m15); add("MACD Trend Continuation","momentum","EURUSD","M15","London",d,strength(delta,atr(m15)),london)
    d,cf=breakout(m5,20); add("Donchian Channel Breakout","breakout","GBPJPY","M5","London",d,cf,london)
    d,cf=breakout(m5,14); recent_atr=atr(m5,5); add("ATR Breakout","breakout","GBPUSD","M5","High Volatility",d,cf,recent_atr>=atr5)
    d,cf=breakout(m1,15); add("Opening Range Breakout (ORB)","breakout","XAUUSD","M1","New York Open",d,cf,ny_open)
    d,cf=breakout(m15,20); add("Turtle Breakout","breakout","USDJPY","M15","London",d,cf,london)
    ema20=_ema(m5["c"],20); keltdir="BUY" if m5["c"][-1]>=ema20 else "SELL"; add("Keltner Channel Pullback","trend","EURUSD","M5","London",keltdir,strength(m5["c"][-1]-ema20,atr5),london)
    mean=sum(m5["c"][-30:])/30; mrdir="BUY" if m5["c"][-1]<mean else "SELL"; add("Mean Reversion","reversion","EURCHF","M5","Asian Session",mrdir,strength(m5["c"][-1]-mean,atr5),asian)
    hdir,_=trend(h1,20,50); edir,ecf=trend(m5,9,20); add("Multi-Timeframe Trend Following","trend","EURUSD","H1 + M5 Entry","London & New York",hdir,min(95,ecf+12 if hdir==edir else 58),london or ny)

    eligible=[s for s in strategy_signals if s["sessionActive"] and s["confidence"]>60]
    buy_votes = [signal for signal in eligible if signal["direction"] == "BUY"]
    sell_votes = [signal for signal in eligible if signal["direction"] == "SELL"]
    aligned = buy_votes if len(buy_votes) >= len(sell_votes) else sell_votes
    aligned_direction = "BUY" if aligned is buy_votes else "SELL"
    alignment_count = len(aligned)
    supporting_families = []
    family_scores = []
    for family in {signal["family"] for signal in eligible}:
        family_signals = [signal for signal in eligible if signal["family"] == family]
        family_buys = [signal for signal in family_signals if signal["direction"] == "BUY"]
        family_sells = [signal for signal in family_signals if signal["direction"] == "SELL"]
        family_winner = family_buys if len(family_buys) >= len(family_sells) else family_sells
        family_direction = "BUY" if family_winner is family_buys else "SELL"
        if family_direction == aligned_direction and family_winner:
            supporting_families.append(family)
            family_scores.append(sum(signal["confidence"] for signal in family_winner)/len(family_winner))
    family_count = len(supporting_families)
    confluence = round(sum(family_scores) / len(family_scores)) if family_scores else 50
    has_strong_signal = any(signal["confidence"] >= 79 for signal in aligned)
    trade_eligible = alignment_count >= 3 and confluence >= 80 and has_strong_signal

    score=(alignment_count*10 if aligned_direction=="BUY" else -alignment_count*10)
    confidence=confluence if alignment_count>=2 else (aligned[0]["confidence"] if aligned else 50)
    status = ("STRONG_" + aligned_direction) if trade_eligible else aligned_direction if alignment_count >= 2 else "NEUTRAL"
    recommended_sl=current-1.2*atr1 if aligned_direction=="BUY" else current+1.2*atr1
    recommended_tp=current+3.6*atr1 if aligned_direction=="BUY" else current-3.6*atr1
    change_15=((current-m1["c"][-16])/m1["c"][-16]*100) if m1["c"][-16] else 0; recent_high=max(m1["h"][-60:]); recent_low=min(m1["l"][-60:])
    md,_=macd_direction(m1)
    confirmation_filters={"ema200Trend":"BUY" if current>=_ema(m1["c"],200) else "SELL","supertrend":"BUY" if _ema(m1["c"],10)>=_ema(m1["c"],30) else "SELL",
        "atrExpanding":atr(m1,5)>=atr1,"volumeConfirmed":volume_ratio>=1.2,"rsiMomentum":round(rsi1,2),"aboveVwap":current>=vwap,
        "adxTrendProxy":round(min(100,abs(_ema(m1["c"],20)-_ema(m1["c"],50))/max(atr1,1e-12)*50),2)}
    result={"symbol":symbol,"timeframe":"session-aware","candle_time":now.isoformat(),"ai_confidence":confidence,"trend_status":status,"score":score,"rsi":round(rsi1,2),
            "macd_signal":md,"ema_trend":"BULLISH" if current>_ema(m1["c"],200) else "BEARISH",
            "ema_short":_ema(m1["c"],20),"ema_long":_ema(m1["c"],50),"change_24h":change_15,"high_24h":recent_high,"low_24h":recent_low,
            "volatility":atr1/current*100 if current else 0,"support":recent_low,"resistance":recent_high,"utc_session_hour":utc,"confirmation_filters":confirmation_filters,
            "strategy_signals":strategy_signals,"strategy_count":len(strategy_signals),"alignment_count":alignment_count,"family_count":family_count,"aligned_direction":aligned_direction,
            "has_strong_signal":has_strong_signal,"trade_eligible":trade_eligible,"atr":atr1,
            "recommended_sl":recommended_sl,"recommended_tp":recommended_tp}
    for old_key in list(_analysis_cache):
        if old_key[0] == cache_key[0] and old_key[1] == symbol and old_key != cache_key:
            _analysis_cache.pop(old_key, None)
    _analysis_cache[cache_key] = result
    return result

def get_analysis_batch(symbols):
    if not _connected_now(): return {"error":"MT5 not connected"}
    result = {}
    for symbol in symbols:
        analysis = get_market_analysis(symbol)
        if "error" not in analysis: result[symbol] = analysis
    return result

def get_symbols():
    if not _connected: return {"error":"MT5 not connected"}
    syms = mt5.symbols_get()
    return [{"name":s.name,"description":s.description,"volume_min":s.volume_min,"volume_step":s.volume_step,"volume_max":s.volume_max,"digits":s.digits,"trade_mode":s.trade_mode,"spread":s.spread,"bid":s.bid,"ask":s.ask} for s in syms] if syms else []

def get_symbol_info(symbol):
    """Get detailed info for one symbol including lot constraints."""
    if not _connected: return {"error":"MT5 not connected"}
    si = mt5.symbol_info(symbol)
    if not si: return {"error":"Symbol not found"}
    return {
        "name":si.name,"description":si.description,
        "volume_min":si.volume_min,"volume_step":si.volume_step,
        "volume_max":si.volume_max,"digits":si.digits,
        "trade_mode":si.trade_mode,"spread":si.spread,
        "contract_size":si.trade_contract_size,
        "margin_initial":si.margin_initial,"margin_maintenance":si.margin_maintenance,
        "swap_long":si.swap_long,"swap_short":si.swap_short,
    }

TIMEFRAMES = {"1m":mt5.TIMEFRAME_M1,"5m":mt5.TIMEFRAME_M5,"15m":mt5.TIMEFRAME_M15,"30m":mt5.TIMEFRAME_M30,"1h":mt5.TIMEFRAME_H1,"4h":mt5.TIMEFRAME_H4,"1d":mt5.TIMEFRAME_D1,"1w":mt5.TIMEFRAME_W1}
def get_candles(symbol, timeframe="1h", count=100):
    if not _connected_now(): return {"error":"MT5 not connected"}
    tf=TIMEFRAMES.get(timeframe.lower())
    if tf is None: return {"error":f"Unsupported timeframe: {timeframe}"}
    count=max(1,min(int(count),5000))
    if not mt5.symbol_select(symbol, True): return {"error":_last_error("Unable to select symbol")}
    rates=mt5.copy_rates_from_pos(symbol, tf, 0, count)
    if rates is None: return {"error":_last_error("Candle request failed")}
    return [{"time":datetime.fromtimestamp(int(r["time"]), timezone.utc).isoformat(),"open":float(r["open"]),"high":float(r["high"]),"low":float(r["low"]),"close":float(r["close"]),"volume":int(r["tick_volume"]),"spread":int(r["spread"])} for r in rates]
