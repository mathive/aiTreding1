import { NextResponse } from "next/server";
import { db } from "@/db";
import { priceFeedSnapshots, strategies } from "@/db/schema";
import { desc } from "drizzle-orm";
import { INITIAL_ASSETS, evaluateMultiStrategyConfluence } from "@/lib/market-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    const allStrategies = await db.select().from(strategies);
    const activeStrategies = allStrategies.filter((s) => s.isActive);

    const assets = (symbol ? INITIAL_ASSETS.filter((a) => a.symbol === symbol) : INITIAL_ASSETS).map((asset) => {
      const jitter = (Math.sin(Date.now() / 8000 + asset.currentPrice) * 0.002) + ((Math.random() - 0.49) * 0.002);
      const livePrice = Number((asset.currentPrice * (1 + jitter)).toFixed(4));
      const bid = Number((livePrice * 0.9999).toFixed(4));
      const ask = Number((livePrice * 1.0001).toFixed(4));
      const spread = Number(((ask - bid) / livePrice * 10000).toFixed(2)); // in pips/bps

      const confluence = evaluateMultiStrategyConfluence(
        { ...asset, currentPrice: livePrice },
        activeStrategies
      );

      return {
        symbol: asset.symbol,
        name: asset.name,
        market: asset.market,
        category: asset.category,
        price: livePrice,
        bid,
        ask,
        spread,
        change24h: asset.change24h,
        change24hPercent: asset.change24h,
        high24h: asset.high24h,
        low24h: asset.low24h,
        volume24h: asset.volume24h,
        volatility: asset.volatility,
        // Technical Indicators
        rsi14: asset.rsi,
        emaShort: Number((livePrice * (1 - asset.volatility * 0.015)).toFixed(4)),
        emaLong: Number((livePrice * (1 - asset.volatility * 0.035)).toFixed(4)),
        macdSignal: asset.macdSignal,
        emaTrend: asset.emaTrend,
        supportPrice: asset.supportPrice,
        resistancePrice: asset.resistancePrice,
        recommendedLeverage: asset.recommendedLeverage,
        // AI Analysis
        aiConfidence: asset.aiConfidence,
        trendStatus: asset.trendStatus,
        confluenceScore: confluence.confluenceScore,
        confluenceSignal: confluence.signal,
        confluenceDirection: confluence.direction,
        targetTP1: confluence.targetPriceTP1,
        targetTP2: confluence.targetPriceTP2,
        stopLossPrice: confluence.stopLossPrice,
        riskRewardRatio: confluence.riskRewardRatio,
        aiSummary: confluence.aiSummary,
        strategyBreakdowns: confluence.strategyBreakdowns,
        // Metadata
        source: "nexus_internal",
        timestamp: Date.now(),
        isMarketOpen: true,
      };
    });

    return NextResponse.json({
      feed: assets,
      count: assets.length,
      activeStrategiesCount: activeStrategies.length,
      timestamp: Date.now(),
      nextRefreshMs: 3000,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch price feed" }, { status: 500 });
  }
}

// Save a price snapshot for historical reference
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { snapshots } = body;

    if (snapshots && Array.isArray(snapshots)) {
      const values = snapshots.map((s: any) => ({
        id: `pfs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        symbol: s.symbol,
        market: s.market || "crypto",
        price: String(s.price),
        bid: s.bid ? String(s.bid) : null,
        ask: s.ask ? String(s.ask) : null,
        volume24h: s.volume24h ? String(s.volume24h) : null,
        change24h: s.change24h ? String(s.change24h) : null,
        high24h: s.high24h ? String(s.high24h) : null,
        low24h: s.low24h ? String(s.low24h) : null,
        source: s.source || "internal",
        rsi14: s.rsi14 ? String(s.rsi14) : null,
        emaShort: s.emaShort ? String(s.emaShort) : null,
        emaLong: s.emaLong ? String(s.emaLong) : null,
        macdSignal: s.macdSignal || null,
        confluenceScore: s.confluenceScore || null,
        trendStatus: s.trendStatus || null,
      }));

      await db.insert(priceFeedSnapshots).values(values);
    }

    return NextResponse.json({ success: true, message: "Snapshots saved" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save snapshots" }, { status: 500 });
  }
}
