"""Read a fresh MT5 history snapshot in an isolated IPC process."""
import json
import sys
from datetime import datetime, timedelta, timezone

import MetaTrader5 as mt5

days = max(1, min(int(sys.argv[1]) if len(sys.argv) > 1 else 7, 3650))
if not mt5.initialize():
    print(json.dumps({"error": f"MT5 history helper initialize failed: {mt5.last_error()}"}))
    raise SystemExit(1)

end = datetime.now(timezone.utc) + timedelta(days=1)
start = end - timedelta(days=days)
deals = mt5.history_deals_get(start, end)
orders = mt5.history_orders_get(start, end)
account = mt5.account_info()
if deals is None or orders is None or account is None:
    print(json.dumps({"error": f"MT5 history helper failed: {mt5.last_error()}"}))
    raise SystemExit(1)

payload = {
    "login": int(account.login),
    "deals": [{
        "ticket": d.ticket, "order": d.order, "position_id": d.position_id, "symbol": d.symbol,
        "type": "BUY" if d.type == mt5.DEAL_TYPE_BUY else "SELL", "entry": d.entry,
        "volume": d.volume, "price": d.price, "profit": d.profit, "commission": d.commission,
        "swap": d.swap, "magic": d.magic, "comment": d.comment,
        "time": datetime.fromtimestamp(d.time, timezone.utc).isoformat(),
    } for d in reversed(deals[-500:])],
    "orders": [{
        "ticket": o.ticket, "symbol": o.symbol, "type": o.type, "state": o.state,
        "volume_initial": o.volume_initial, "volume_current": o.volume_current,
        "price_open": o.price_open, "sl": o.sl, "tp": o.tp,
        "time_setup": datetime.fromtimestamp(o.time_setup, timezone.utc).isoformat(),
    } for o in reversed(orders[-500:])],
}
print(json.dumps(payload))
