import { NextResponse } from "next/server";
import { db } from "@/db";
import { watchlists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";
import { INITIAL_ASSETS } from "@/lib/market-data";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const items = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.userId, currentUser.id));

    // Hydrate with latest market data
    const hydrated = items.map((w) => {
      const asset = INITIAL_ASSETS.find((a) => a.symbol === w.symbol);
      return {
        ...w,
        currentPrice: asset?.currentPrice || 100,
        change24h: asset?.change24h || 0,
        trendStatus: asset?.trendStatus || "NEUTRAL",
      };
    });

    return NextResponse.json({ watchlist: hydrated });
  } catch (error: any) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch watchlist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { symbol, name, market, alertHigh, alertLow, notes } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const asset = INITIAL_ASSETS.find((a) => a.symbol === symbol);
    const newId = `wl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const [item] = await db
      .insert(watchlists)
      .values({
        id: newId,
        userId: currentUser.id,
        symbol,
        name: name || asset?.name || symbol,
        market: market || asset?.market || "crypto",
        alertHigh: alertHigh ? String(alertHigh) : null,
        alertLow: alertLow ? String(alertLow) : null,
        aiSentiment: asset?.trendStatus === "STRONG_BUY" || asset?.trendStatus === "BUY" ? "BULLISH" : "NEUTRAL",
        aiScore: asset?.aiConfidence || 80,
        favorite: true,
        notes,
      })
      .returning();

    return NextResponse.json({
      success: true,
      item,
      message: `Added ${symbol} to watchlist`,
    });
  } catch (error: any) {
    console.error("Error adding to watchlist:", error);
    return NextResponse.json({ error: error.message || "Failed to add to watchlist" }, { status: 500 });
  }
}
