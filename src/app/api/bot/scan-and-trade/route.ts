import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";
import { getLiveTickers } from "@/lib/market-data-service";

export async function POST(request: Request) {
  try {
    await getCurrentUser();
    const body = await request.json().catch(() => ({}));
    const targetSymbol = body.targetSymbol;

    const tickers = await getLiveTickers();
    const assets = targetSymbol ? tickers.filter((a: any) => a.symbol === targetSymbol) : tickers;

    return NextResponse.json({
      success: true,
      scannedCount: assets.length,
      newTradesCount: 0,
      scanResults: assets.map((a: any) => ({ asset: a, confluence: { confluenceScore: 50, signal: "NEUTRAL", direction: "HOLD" } })),
      message: `Scanner ready — ${assets.length} symbols from Vantage MT5. Place trades manually or use terminal.`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
