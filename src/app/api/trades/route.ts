import { NextResponse } from "next/server";
import { db } from "@/db";
import { trades as tradesTable, users, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";
import { getLiveTickers } from "@/lib/market-data-service";

const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";
async function mt5(path: string, opts?: RequestInit) {
  try { const r = await fetch(B + path, { ...opts, headers: { "Content-Type": "application/json", ...opts?.headers } });
    return r.ok ? r.json() : null; } catch { return null; }
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"), market = searchParams.get("market"), search = searchParams.get("search");
    const sync = searchParams.get("sync") === "mt5";

    if (sync) {
      const mt5Pos: any[] = await mt5("/positions") || [];
      const mt5List = mt5Pos.map((p: any) => ({
        id: "mt5_" + p.ticket, userId: currentUser.id,
        symbol: p.symbol, market: "forex", type: p.type || "BUY", status: "OPEN",
        entryPrice: String(p.open_price), currentPrice: String(p.current_price),
        quantity: String(p.volume), amount: String(p.volume * (p.open_price || 0)),
        leverage: 100, stopLoss: p.sl ? String(p.sl) : null, takeProfit: p.tp ? String(p.tp) : null,
        trailingStop: false, pnl: String(p.profit || 0),
        pnlPercent: p.current_price && p.open_price ? String(
          p.type === "BUY" ? ((p.current_price - p.open_price) / p.open_price * 10000).toFixed(2)
          : ((p.open_price - p.current_price) / p.open_price * 10000).toFixed(2)) : "0",
        strategyUsed: "MT5 Vantage", aiConfidence: 50, aiReasoning: "Real MT5 position",
        executionType: "external", entryTime: String(p.open_time || new Date().toISOString()),
      }));
      return NextResponse.json({ trades: mt5List, stats: { totalTrades: mt5List.length, openCount: mt5List.length, source: "mt5_live" } });
    }

    let all = await db.select().from(tradesTable).where(eq(tradesTable.userId, currentUser.id)).orderBy(desc(tradesTable.entryTime));
    if (status && status !== "ALL") all = all.filter(t => t.status === status);
    if (market && market !== "all") all = all.filter(t => t.market === market);
    if (search) { const q = search.toLowerCase(); all = all.filter(t => t.symbol.toLowerCase().includes(q) || t.strategyUsed.toLowerCase().includes(q)); }
    const openT = all.filter(t => t.status === "OPEN"), closedT = all.filter(t => t.status === "CLOSED");
    const totalOpenPnl = openT.reduce((a, t) => a + Number(t.pnl || 0), 0);
    const totalClosedPnl = closedT.reduce((a, t) => a + Number(t.pnl || 0), 0);
    const wins = closedT.filter(t => Number(t.pnl || 0) > 0).length;
    const winRate = closedT.length > 0 ? Number(((wins / closedT.length) * 100).toFixed(1)) : 0;
    return NextResponse.json({ trades: all, stats: { totalTrades: all.length, openCount: openT.length, closedCount: closedT.length, totalOpenPnl: Number(totalOpenPnl.toFixed(2)), totalClosedPnl: Number(totalClosedPnl.toFixed(2)), winRate } });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const cu = await getCurrentUser();
    const body = await request.json();
    const { symbol, market = "forex", type = "BUY", amount: vol, leverage = 100, stopLoss, takeProfit,
      trailingStop = false, trailingDistance, strategyUsed = "Manual", aiConfidence = 85,
      aiReasoning = "Manual order", executionType = "manual", entryPrice: customEp } = body;
    if (!symbol || !vol || Number(vol) <= 0) return NextResponse.json({ error: "Symbol and volume required" }, { status: 400 });

    // 1. PLACE ON MT5
    const mt5r = await mt5("/order", { method: "POST", body: JSON.stringify({ symbol, order_type: type, volume: Number(vol), sl: Number(stopLoss || 0), tp: Number(takeProfit || 0), comment: "Nexus AI" }) });
    const mt5Ticket = mt5r?.ticket || null;

    // 2. Get live price
    let entryPrice = customEp ? Number(customEp) : 1;
    try { const t = await getLiveTickers(); const a = t.find(x => x.symbol === symbol); if (a) entryPrice = a.currentPrice; } catch {}

    // 3. Save to DB
    const tid = mt5Ticket ? "trade_mt5_" + mt5Ticket : "trade_" + Date.now() + "_" + Math.random().toString(36).slice(2,6);
    const [nt] = await db.insert(tradesTable).values({
      id: tid, userId: cu.id, symbol, market, type, status: "OPEN",
      entryPrice: String(entryPrice), currentPrice: String(entryPrice),
      quantity: String(vol), amount: String((Number(vol) * entryPrice).toFixed(2)),
      leverage: Number(leverage), stopLoss: stopLoss ? String(stopLoss) : null,
      takeProfit: takeProfit ? String(takeProfit) : null,
      trailingStop: Boolean(trailingStop), trailingDistance: trailingDistance ? String(trailingDistance) : null,
      pnl: "0.00", pnlPercent: "0.00", strategyUsed, aiConfidence: Number(aiConfidence),
      aiReasoning, executionType, entryTime: new Date().toISOString(),
    }).returning();

    await db.insert(notifications).values({
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2,6),
      userId: cu.id,
      title: mt5Ticket ? "⚡ MT5 Order Placed" : "⚠ Saved (MT5 offline)",
      message: mt5Ticket ? `${type} ${symbol} — MT5 #${mt5Ticket} — Vol: ${vol} lots`
        : `Trade saved locally. MT5 bridge unreachable.`,
      type: mt5Ticket ? "trade_executed" : "system", isRead: false,
      metadata: { tradeId: nt.id, mt5Ticket, symbol, volume: vol }
    });

    return NextResponse.json({ success: true, trade: nt, mt5Ticket, message: mt5Ticket ? `MT5 order #${mt5Ticket} placed` : "Saved locally (MT5 offline)" });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
