import { NextResponse } from "next/server";
import { getLiveTickers } from "@/lib/market-data-service";

export async function GET() {
  try {
    const assets = await getLiveTickers();
    const timestamp = Date.now();
    const feed = assets.slice(0, 12).map((asset) => {
      const bid = asset.supportPrice || asset.currentPrice;
      const ask = asset.currentPrice;
      const isBearish = asset.trendStatus === "SELL" || asset.trendStatus === "STRONG_SELL";
      const isBullish = asset.trendStatus === "BUY" || asset.trendStatus === "STRONG_BUY";
      const stopLossPrice = asset.recommendedStopLoss ?? (isBearish ? ask * 1.002 : bid * 0.998);
      const targetTP1 = asset.recommendedTakeProfit ?? (isBearish ? bid * 0.994 : ask * 1.006);
      return {
        symbol: asset.symbol, displaySymbol: asset.displaySymbol, name: asset.name, market: asset.market,
        price: ask, bid, ask, spread: Math.max(0, ask - bid),
        change24h: asset.change24h, high24h: asset.high24h, low24h: asset.low24h,
        volume24h: asset.volume24h, rsi14: asset.rsi,
        emaShort: ask, emaLong: bid, macdSignal: asset.macdSignal, emaTrend: asset.emaTrend,
        confluenceScore: asset.aiConfidence, confluenceSignal: asset.trendStatus,
        confluenceDirection: isBullish ? "LONG" : isBearish ? "SHORT" : "HOLD",
        aiConfidence: asset.aiConfidence, trendStatus: asset.trendStatus,
        targetTP1, stopLossPrice, riskRewardRatio: 3,
        aiSummary: `Live MT5 ${asset.symbol} quote. Signal: ${asset.trendStatus}.`, timestamp,
      };
    });
    return NextResponse.json({ feed, count: feed.length, timestamp });
  } catch (error: any) {
    return NextResponse.json({ feed: [], error: error.message || "MT5 price feed unavailable", timestamp: Date.now() }, { status: 503 });
  }
}
