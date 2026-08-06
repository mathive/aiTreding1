import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";
import { getLiveTickers } from "@/lib/market-data-service";

const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";

async function mt5Order(symbol: string, type: string, volume: number) {
  try {
    const r = await fetch(B + "/order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, order_type: type, volume, sl: 0, tp: 0, comment: "Nexus AI Scan" }),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

export async function POST(request: Request) {
  try {
    await getCurrentUser();
    const body = await request.json().catch(() => ({}));
    const forceExecute = body.forceExecute || false;
    const targetSymbol = body.targetSymbol;

    const tickers = await getLiveTickers();
    const assets = targetSymbol ? tickers.filter((a: any) => a.symbol === targetSymbol) : tickers;

    let tradesPlaced = 0;
    const executedTrades: any[] = [];

    if (forceExecute && assets.length > 0) {
      const candidates = assets.slice(0, 2);
      for (const asset of candidates) {
        const result = await mt5Order(asset.symbol, "BUY", 0.01);
        if (result?.success) {
          tradesPlaced++;
          executedTrades.push({ symbol: asset.symbol, ticket: result.ticket, volume: 0.01, price: asset.currentPrice });
        }
      }
    }

    return NextResponse.json({
      success: true,
      scannedCount: assets.length,
      newTradesCount: tradesPlaced,
      newTrades: executedTrades,
      scanResults: assets.map((a: any) => ({ asset: a, confluence: { confluenceScore: 50, signal: forceExecute ? "BUY" : "NEUTRAL", direction: forceExecute ? "LONG" : "HOLD" } })),
      message: tradesPlaced > 0
        ? "MT5 executed " + tradesPlaced + " trade(s) on Vantage!"
        : "Scanner ready — " + assets.length + " symbols. Click Force Scan to auto-trade.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
