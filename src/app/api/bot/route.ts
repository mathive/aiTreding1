import { NextResponse } from "next/server";
import { getLiveTickers } from "@/lib/market-data-service";
import { getCurrentUser } from "@/lib/auth-helper";

export async function GET() {
  try {
    const tickers = await getLiveTickers().catch(() => []);

    return NextResponse.json({
      bot: {
        id: "bot_active",
        name: "MT5 Auto Trader",
        isActive: true,
        selectedStrategyIds: [{ strategyId: "s1", weight: 50 }, { strategyId: "s2", weight: 50 }],
        confluenceThreshold: 50,
        tradeAllocationType: "percent",
        tradeAllocationValue: "5.00",
        maxOpenTrades: 4,
        allowedMarkets: ["forex", "commodities"],
        executionMode: "autonomous",
        defaultLeverage: 100,
        totalBotTrades: 0,
        botPnl: "0.00",
      },
      strategies: [
        { id: "s1", name: "Trend Following", isActive: true, category: "trend_follow" },
        { id: "s2", name: "Breakout Scalper", isActive: true, category: "breakout" },
        { id: "s3", name: "Mean Reversion", isActive: false, category: "mean_reversion" },
      ],
      openTradesCount: 0,
      maxTrades: 4,
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
    return NextResponse.json({ success: true, bot: { ...body, isActive: body.isActive ?? true, id: "bot_active" } });
  } catch { return NextResponse.json({ success: true }); }
}
