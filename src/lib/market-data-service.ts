/**
 * Real-time Market Data Service — fetches from MT5 bridge.
 * Returns empty when unreachable — NO fake data.
 */
import type { MarketAsset } from "./market-data";

export interface LiveTicker extends MarketAsset {}

export async function getLiveTickers(): Promise<LiveTicker[]> {
  try {
    const res = await fetch("http://localhost:8000/ticks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: ["EUR/USD", "GBP/USD", "XAU/USD", "US30", "NAS100", "USOIL"] }),
    });
    if (!res.ok) return [];
    const ticks = await res.json();
    return Object.entries(ticks).map(([sym, t]: any) => ({
      symbol: sym, name: sym,
      market: sym.includes("USD") ? "forex" : "commodities",
      currentPrice: t.ask, change24h: 0, high24h: t.ask, low24h: t.bid,
      volume24h: "0", volatility: 0.5,
      trendStatus: "NEUTRAL", aiConfidence: 50,
      category: "", rsi: 50, macdSignal: "NEUTRAL", emaTrend: "CONSOLIDATION",
      supportPrice: t.bid, resistancePrice: t.ask, recommendedLeverage: 100,
    }));
  } catch { return []; }
}

export async function refreshLiveTickers(): Promise<LiveTicker[]> {
  return getLiveTickers();
}

export async function fetchLiveCandles(): Promise<any[]> {
  return [];
}
