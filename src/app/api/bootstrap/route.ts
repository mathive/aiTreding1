import { NextResponse } from "next/server";

const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";

async function call(path: string, opts?: RequestInit) {
  try { const r = await fetch(B + path, { ...opts, headers: { "Content-Type": "application/json", ...opts?.headers } }); return r.ok ? r.json() : null; } catch { return null; }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountName, accountBalance } = body;

    // Pull fresh data from MT5 bridge
    const act = await call("/account");
    const pos = await call("/positions") || [];
    const sym = await call("/symbols") || [];

    // Use MT5 name if available, otherwise passed name, then fallback
    const name = act?.name || accountName || "Trader";
    const bal = act?.balance ?? accountBalance ?? 0;

    console.log("[Bootstrap] MT5 account:", name, "Balance:", bal, "Positions:", Array.isArray(pos) ? pos.length : 0, "Symbols:", Array.isArray(sym) ? sym.length : 0);

    return NextResponse.json({
      success: true,
      user: {
        id: "default",
        name,
        email: name.toLowerCase().replace(/\s+/g, ".") + "@vantage.mt5",
        balance: String(bal),
        initialBalance: String(bal),
        currency: act?.currency || "USD",
        maxLeverage: act?.leverage || 500,
        tradingMode: "live",
        autoTradingEnabled: true,
        soundEffects: true,
        apiKeySimulation: false,
        traderType: "day_trader",
        riskMode: "moderate",
      },
      positions: Array.isArray(pos) ? pos.map((p: any) => ({
        ticket: p.ticket,
        symbol: p.symbol,
        type: p.type,
        volume: p.volume,
        openPrice: p.open_price,
        currentPrice: p.current_price,
        profit: p.profit,
        swap: p.swap,
        sl: p.sl,
        tp: p.tp,
        openTime: p.open_time,
      })) : [],
      symbols: Array.isArray(sym) ? sym.map((s: any) => ({
        name: s.name,
        volumeMin: s.volume_min ?? 0.01,
        volumeStep: s.volume_step ?? 0.01,
      })) : [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
