import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";

const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";
async function mt5(p: string, o?: RequestInit) {
  try { const r = await fetch(B + p, { ...o, headers: { "Content-Type": "application/json", ...o?.headers } });
    return r.ok ? r.json() : null; } catch { return null; }
}

export async function GET() {
  try {
    const cu = await getCurrentUser();
    const pos: any[] = await mt5("/positions") || [];
    const trades = pos.map((p: any) => ({
      id: "mt5_" + p.ticket, userId: cu.id, symbol: p.symbol, market: "forex",
      type: p.type || "BUY", status: "OPEN",
      entryPrice: String(p.open_price), currentPrice: String(p.current_price),
      quantity: String(p.volume), amount: String(p.volume * (p.open_price || 0)),
      leverage: 0, stopLoss: p.sl ? String(p.sl) : null, takeProfit: p.tp ? String(p.tp) : null,
      trailingStop: false, pnl: String(p.profit || 0),
      pnlPercent: p.current_price && p.open_price ? String(
        p.type === "BUY" ? ((p.current_price - p.open_price) / p.open_price * 100).toFixed(2)
        : ((p.open_price - p.current_price) / p.open_price * 100).toFixed(2)) : "0",
      strategyUsed: "MT5 Vantage", aiConfidence: 50, aiReasoning: "Live MT5 position",
      executionType: "mt5", entryTime: String(p.open_time || new Date().toISOString()),
      source: "mt5",
    }));
    const openPnL = trades.reduce((a, t) => a + Number(t.pnl || 0), 0);
    return NextResponse.json({ trades, stats: { totalTrades: trades.length, openCount: trades.length, totalOpenPnl: Number(openPnL.toFixed(2)), source: "mt5_live" } });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const cu = await getCurrentUser();
    const { symbol, type = "BUY", amount: vol } = await request.json();
    if (!symbol || !vol) return NextResponse.json({ error: "Symbol and volume required" }, { status: 400 });

    const r = await mt5("/order", { method: "POST", body: JSON.stringify({ symbol, order_type: type, volume: Number(vol), sl: 0, tp: 0, comment: "Nexus AI" }) });
    if (r?.success) {
      return NextResponse.json({ success: true, ticket: r.ticket, message: `MT5 order #${r.ticket} placed` });
    }
    return NextResponse.json({ success: false, error: r?.error || "MT5 order failed" }, { status: 502 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
