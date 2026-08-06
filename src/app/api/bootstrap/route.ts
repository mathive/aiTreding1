import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, strategies, botConfigs } from "@/db/schema";
import { eq } from "drizzle-orm";

const T = new Date().toISOString();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mt5Login, mt5Server, accountName, accountBalance } = body;

    const userId = "user_default";

    // 1. Ensure user exists with MT5 details
    const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existing.length > 0) {
      await db.update(users).set({
        name: accountName || "Trader",
        balance: String(Number(accountBalance || 0).toFixed(2)),
        initialBalance: String(Number(accountBalance || 0).toFixed(2)),
        autoTradingEnabled: true,
        updatedAt: T,
      }).where(eq(users.id, userId));
    } else {
      await db.insert(users).values({
        id: userId, name: accountName || "Trader", email: "trader@localhost",
        traderType: "day_trader",
        balance: String(Number(accountBalance || 0).toFixed(2)),
        initialBalance: String(Number(accountBalance || 0).toFixed(2)),
        currency: "USD", riskMode: "moderate", maxDailyLoss: "0.00",
        maxLeverage: 500, autoTradingEnabled: true, soundEffects: true,
        theme: "dark", apiKeySimulation: false,
        createdAt: T, updatedAt: T,
      });
    }

    // 2. Seed basic strategies if none exist
    const existingStrats = await db.select().from(strategies).limit(1);
    if (existingStrats.length === 0) {
      const defaultStrats = [
        { id: "s1", userId, name: "Trend Following", description: "Follow the trend using EMAs", category: "trend_follow", timeframes: ["1h","4h"], indicators: {} as any, targetAssets: ["EUR/USD","GBP/USD","XAU/USD"], weight: 40, minConfidence: 70, stopLossPercent: "2.00", takeProfitPercent: "5.00", trailingStop: true, isActive: true, createdAt: T, updatedAt: T },
        { id: "s2", userId, name: "Breakout Scalper", description: "Breakout on 5m/15m", category: "breakout", timeframes: ["5m","15m"], indicators: {} as any, targetAssets: ["EUR/USD","GBP/USD"], weight: 30, minConfidence: 75, stopLossPercent: "1.50", takeProfitPercent: "3.00", trailingStop: true, isActive: true, createdAt: T, updatedAt: T },
        { id: "s3", userId, name: "Mean Reversion", description: "Buy dips sell rips", category: "mean_reversion", timeframes: ["15m","1h"], indicators: {} as any, targetAssets: ["XAU/USD","EUR/USD"], weight: 30, minConfidence: 72, stopLossPercent: "1.80", takeProfitPercent: "4.00", trailingStop: false, isActive: false, createdAt: T, updatedAt: T },
      ];
      for (const s of defaultStrats) {
        await db.insert(strategies).values({ ...s, traderTypeMatch: "all", indicators: JSON.stringify({}), targetAssets: JSON.stringify(s.targetAssets), timeframes: JSON.stringify(s.timeframes) });
      }
    }

    // 3. Create bot config if none exists
    const existingBot = await db.select().from(botConfigs).where(eq(botConfigs.userId, userId)).limit(1);
    if (existingBot.length === 0) {
      await db.insert(botConfigs).values({
        id: "bot_default", userId, name: "Default Bot",
        isActive: false, selectedStrategyIds: JSON.stringify([{ strategyId: "s1", weight: 50 }, { strategyId: "s2", weight: 50 }]),
        confluenceThreshold: 75, tradeAllocationType: "percent", tradeAllocationValue: "5.00",
        maxOpenTrades: 4, allowedMarkets: JSON.stringify(["forex", "commodities"]),
        executionMode: "semi_autonomous", defaultLeverage: 100,
        createdAt: T, updatedAt: T,
      });
    }

    return NextResponse.json({ success: true, message: "System bootstrapped" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
