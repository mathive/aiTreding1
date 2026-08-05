import { NextResponse } from "next/server";
import { INITIAL_ASSETS, generateCandles } from "@/lib/market-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "BTC/USDT";
    const timeframe = searchParams.get("timeframe") || "1h";
    const count = Math.min(120, Math.max(30, Number(searchParams.get("count") || 60)));

    const asset = INITIAL_ASSETS.find((a) => a.symbol === symbol) || INITIAL_ASSETS[0];
    const candles = generateCandles(asset.currentPrice, asset.volatility, timeframe, count);

    return NextResponse.json({
      symbol: asset.symbol,
      name: asset.name,
      timeframe,
      currentPrice: asset.currentPrice,
      candles,
    });
  } catch (error: any) {
    console.error("Error generating candles:", error);
    return NextResponse.json({ error: error.message || "Failed to generate candles" }, { status: 500 });
  }
}
