import { NextResponse } from "next/server";
import { fetchLiveCandles } from "@/lib/market-data-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "BTC/USDT";
    const timeframe = searchParams.get("timeframe") || "1h";
    const count = Math.min(120, Math.max(30, Number(searchParams.get("count") || 60)));
    const candles = await fetchLiveCandles(symbol, timeframe, count);
    return NextResponse.json({ symbol, timeframe, candles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch candle data" }, { status: 500 });
  }
}
