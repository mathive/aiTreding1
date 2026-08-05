import { NextResponse } from "next/server";
import { db } from "@/db";
import { strategies } from "@/db/schema";
import { INITIAL_ASSETS, evaluateMultiStrategyConfluence } from "@/lib/market-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get("market"); // crypto, stocks, forex, or all
    const search = searchParams.get("search");

    const allStrategies = await db.select().from(strategies);
    const activeStrategies = allStrategies.filter((s) => s.isActive);

    let assets = INITIAL_ASSETS.map((asset) => {
      // Add subtle dynamic price fluctuations
      const jitter = (Math.sin(Date.now() / 10000 + asset.currentPrice) * 0.002);
      const livePrice = Number((asset.currentPrice * (1 + jitter)).toFixed(4));
      const evalResult = evaluateMultiStrategyConfluence(
        { ...asset, currentPrice: livePrice },
        activeStrategies
      );

      return {
        ...asset,
        currentPrice: livePrice,
        confluenceResult: evalResult,
      };
    });

    if (market && market !== "all") {
      assets = assets.filter((a) => a.market === market);
    }
    if (search) {
      const q = search.toLowerCase();
      assets = assets.filter(
        (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      assets,
      activeStrategiesCount: activeStrategies.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Error fetching market data:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch market data" }, { status: 500 });
  }
}
