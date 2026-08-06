import { NextResponse } from "next/server";
import { db } from "@/db";
import { strategies } from "@/db/schema";
import { getLiveTickers } from "@/lib/market-data-service";
import { evaluateMultiStrategyConfluence } from "@/lib/market-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get("market");
    const search = searchParams.get("search");
    const allStrategies = await db.select().from(strategies);
    const activeStrategies = allStrategies.filter((s) => s.isActive);
    const liveTickers = await getLiveTickers();
    let assets = liveTickers.map((asset) => {
      const evalResult = evaluateMultiStrategyConfluence(asset, activeStrategies);
      return { ...asset, confluenceResult: evalResult };
    });
    if (market && market !== "all") assets = assets.filter((a) => a.market === market);
    if (search) {
      const q = search.toLowerCase();
      assets = assets.filter((a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    }
    return NextResponse.json({ assets, activeStrategiesCount: activeStrategies.length, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch market data" }, { status: 500 });
  }
}
