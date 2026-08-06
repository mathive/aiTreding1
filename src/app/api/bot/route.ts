import { NextResponse } from "next/server";
import { getLiveTickers } from "@/lib/market-data-service";
import { getCurrentUser } from "@/lib/auth-helper";
import { db } from "@/db";
import { botStates } from "@/db/schema";
import { eq } from "drizzle-orm";

const defaultBot = {
  id: "bot_active", name: "MT5 Auto Trader", isActive: true,
  selectedStrategyIds: [{ strategyId: "s1", weight: 50 }, { strategyId: "s2", weight: 50 }],
  confluenceThreshold: 50, tradeAllocationType: "percent", tradeAllocationValue: "5.00",
  maxOpenTrades: 4, allowedMarkets: ["forex", "commodities"], executionMode: "autonomous",
  defaultLeverage: 100, totalBotTrades: 0, botPnl: "0.00",
};

async function getSavedBot() {
  const [saved] = await db.select().from(botStates).where(eq(botStates.id, "bot_active"));
  return { ...defaultBot, ...(saved?.config || {}) };
}

export async function GET() {
  try {
    const tickers = await getLiveTickers().catch(() => []);

    const bot = await getSavedBot();
    return NextResponse.json({
      bot,
      strategies: [
        { id: "s1", name: "Trend Following", isActive: true, category: "trend_follow" },
        { id: "s2", name: "Breakout Scalper", isActive: true, category: "breakout" },
        { id: "s3", name: "Mean Reversion", isActive: false, category: "mean_reversion" },
      ],
      openTradesCount: 0,
      maxTrades: bot.maxOpenTrades,
      assetConfluences: tickers.slice(0, 8).map((a: any) => ({
        ...a, confluenceResult: { confluenceScore: a.aiConfidence || 50, signal: "NEUTRAL", direction: "HOLD" }
      })),
      userBalance: "0",
      autoTradingEnabled: true,
    });
  } catch {
    return NextResponse.json({
      bot: { id: "bot_active", name: "MT5 Auto Trader", isActive: true, maxOpenTrades: 4, executionMode: "autonomous", defaultLeverage: 100 },
      strategies: [],
      openTradesCount: 0,
      maxTrades: 4,
      assetConfluences: [],
      autoTradingEnabled: true,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    await getCurrentUser();
    const body = await request.json();
    const bot = { ...(await getSavedBot()), ...body, id: "bot_active" };
    const updatedAt = new Date().toISOString();
    await db.insert(botStates).values({ id: "bot_active", config: bot, updatedAt })
      .onConflictDoUpdate({ target: botStates.id, set: { config: bot, updatedAt } });
    return NextResponse.json({ success: true, bot });
  } catch (error: any) { return NextResponse.json({ error: error.message || "Failed to save bot" }, { status: 500 }); }
}
