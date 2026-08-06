import { NextResponse } from "next/server";
import { db } from "@/db";
import { botConfigs, strategies, trades } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";
import { getLiveTickers, LiveTicker } from "@/lib/market-data-service";
import { evaluateMultiStrategyConfluence } from "@/lib/market-data";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    let [bot] = await db.select().from(botConfigs).where(eq(botConfigs.userId, currentUser.id)).limit(1);

    // Parse JSON fields that may come back as strings from SQLite
    if (bot) {
      try {
        if (typeof bot.selectedStrategyIds === "string") bot.selectedStrategyIds = JSON.parse(bot.selectedStrategyIds);
        if (typeof bot.allowedMarkets === "string") bot.allowedMarkets = JSON.parse(bot.allowedMarkets);
      } catch {}
    }

    const allStrategies = await db.select().from(strategies);
    const openTrades = await db.select().from(trades).where(and(eq(trades.userId, currentUser.id), eq(trades.status, "OPEN")));
    const activeStrategyIds = bot ? (Array.isArray(bot.selectedStrategyIds) ? bot.selectedStrategyIds.map((s: any) => s.strategyId) : []) : [];
    const activeStrategies = allStrategies.filter((s) => activeStrategyIds.includes(s.id) || s.isActive);
    let liveTickers: LiveTicker[];
    try { liveTickers = await getLiveTickers(); } catch { liveTickers = []; }
    const assetConfluences = liveTickers.slice(0, 8).map((asset) => {
      const evalResult = evaluateMultiStrategyConfluence(asset, activeStrategies);
      return { ...asset, confluenceResult: evalResult };
    });
    return NextResponse.json({ bot: bot || { isActive: false }, strategies: allStrategies, activeStrategies, openTradesCount: openTrades.length, maxTrades: bot?.maxOpenTrades || 4, assetConfluences, userBalance: currentUser.balance, autoTradingEnabled: currentUser.autoTradingEnabled });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch bot configuration" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { name, isActive, selectedStrategyIds, confluenceThreshold, tradeAllocationType, tradeAllocationValue, maxOpenTrades, allowedMarkets, executionMode, defaultLeverage } = body;
    let [bot] = await db.select().from(botConfigs).where(eq(botConfigs.userId, currentUser.id)).limit(1);
    const updatePayload: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updatePayload.name = name;
    if (isActive !== undefined) updatePayload.isActive = Boolean(isActive);
    if (selectedStrategyIds !== undefined) updatePayload.selectedStrategyIds = selectedStrategyIds;
    if (confluenceThreshold !== undefined) updatePayload.confluenceThreshold = Number(confluenceThreshold);
    if (tradeAllocationType !== undefined) updatePayload.tradeAllocationType = tradeAllocationType;
    if (tradeAllocationValue !== undefined) updatePayload.tradeAllocationValue = String(tradeAllocationValue);
    if (maxOpenTrades !== undefined) updatePayload.maxOpenTrades = Number(maxOpenTrades);
    if (allowedMarkets !== undefined) updatePayload.allowedMarkets = allowedMarkets;
    if (executionMode !== undefined) updatePayload.executionMode = executionMode;
    if (defaultLeverage !== undefined) updatePayload.defaultLeverage = Number(defaultLeverage);
    let updatedBot;
    if (bot) {
      const [res] = await db.update(botConfigs).set(updatePayload).where(eq(botConfigs.id, bot.id)).returning();
      updatedBot = res;
    } else {
      const newBotId = `bot_${Date.now()}`;
      const [res] = await db.insert(botConfigs).values({
        id: newBotId, userId: currentUser.id, name: name || "Autonomous Strategy Trader",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        selectedStrategyIds: selectedStrategyIds || [{ strategyId: "strat_breakout_momentum", weight: 35 }, { strategyId: "strat_neural_trend_pulse", weight: 35 }],
        confluenceThreshold: confluenceThreshold || 75, tradeAllocationType: tradeAllocationType || "percent",
        tradeAllocationValue: String(tradeAllocationValue || "5.00"), maxOpenTrades: maxOpenTrades || 4,
        allowedMarkets: allowedMarkets || ["crypto", "stocks", "forex"],
        executionMode: executionMode || "autonomous", defaultLeverage: defaultLeverage || 5,
      }).returning();
      updatedBot = res;
    }
    return NextResponse.json({ success: true, bot: updatedBot, message: "Bot configuration updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update bot config" }, { status: 500 });
  }
}
