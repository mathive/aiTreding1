/**
 * Real-time Market Data Service — 100% MT5 bridge. No Binance, no Yahoo, no fallback.
 */
import type { MarketAsset } from "./market-data";

export interface LiveTicker extends MarketAsset {}

const BRIDGE = "http://localhost:8000";

async function bridgeCall<T = any>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(BRIDGE + path, { ...opts, headers: { "Content-Type": "application/json", ...opts?.headers } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

let cachedSymbols: string[] | null = null;

async function getMT5Symbols(): Promise<string[]> {
  if (cachedSymbols) return cachedSymbols;
  const data = await bridgeCall<any[]>("/symbols");
  if (data && Array.isArray(data)) {
    cachedSymbols = data.map((s: any) => s.name).filter(Boolean);
    return cachedSymbols;
  }
  return [];
}

function classifySymbol(sym: string): { market: "forex" | "stocks" | "crypto"; category: string; name: string; leverage: number } {
  const u = sym.toUpperCase();
  if (["EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","NZDUSD","USDCAD","EURGBP","EURJPY","GBPJPY"].some(s => u.includes(s)))
    return { market: "forex", category: "Major FX Pair", name: sym, leverage: 500 };
  if (u.includes("USD")||u.includes("JPY")||u.includes("GBP")||u.includes("EUR")||u.includes("CHF")||u.includes("AUD")||u.includes("NZD")||u.includes("CAD"))
    return { market: "forex", category: "Minor / Cross", name: sym, leverage: 200 };
  if (u.includes("XAU")||u.includes("GOLD")) return { market:"forex",category:"Precious Metals",name:"Gold Spot",leverage:100};
  if (u.includes("XAG")||u.includes("SILVER")) return { market:"forex",category:"Precious Metals",name:"Silver Spot",leverage:100};
  if (u.includes("US30")||u.includes("DJI")||u.includes("DOW")) return { market:"stocks",category:"US Index",name:"Dow Jones",leverage:200};
  if (u.includes("NAS")||u.includes("NDX")) return { market:"stocks",category:"US Index",name:"NASDAQ",leverage:200};
  if (u.includes("SPX")||u.includes("S&P")||u.includes("SP500")) return { market:"stocks",category:"US Index",name:"S&P 500",leverage:200};
  if (u.includes("DAX")||u.includes("GER")) return { market:"stocks",category:"EU Index",name:"DAX 40",leverage:200};
  if (u.includes("FTSE")||u.includes("UK100")) return { market:"stocks",category:"EU Index",name:"FTSE 100",leverage:200};
  if (u.includes("OIL")||u.includes("BRENT")||u.includes("WTI")||u.includes("CL")) return { market:"forex",category:"Energy",name:"Crude Oil",leverage:100};
  if (u.includes("NGAS")||u.includes("NATGAS")) return { market:"forex",category:"Energy",name:"Natural Gas",leverage:50};
  if (["BTC","ETH","XRP","LTC","BCH","SOL","ADA","DOT"].some(s=>u.includes(s)))
    return { market:"crypto",category:"Crypto CFD",name:sym,leverage:20};
  if (["AAPL","NVDA","TSLA","MSFT","GOOG","AMZN","META"].some(s=>u.includes(s)))
    return { market:"stocks",category:"US Equity",name:sym,leverage:20};
  return { market:"forex",category:"CFD",name:sym,leverage:100};
}

export async function getLiveTickers(): Promise<LiveTicker[]> {
  const symbols = await getMT5Symbols();
  if (symbols.length === 0) return [];

  const results: LiveTicker[] = [];
  const batchSize = 50;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const ticks = await bridgeCall<Record<string, any>>("/ticks", { method: "POST", body: JSON.stringify({ symbols: batch }) });
    if (ticks) {
      for (const [sym, t] of Object.entries(ticks)) {
        const cls = classifySymbol(sym);
        results.push({
          symbol: sym, name: cls.name, market: cls.market, category: cls.category,
          currentPrice: t.ask, change24h: 0, high24h: t.ask, low24h: t.bid,
          volume24h: "N/A", volatility: 0.5, trendStatus: "NEUTRAL", aiConfidence: 50,
          rsi: 50, macdSignal: "NEUTRAL", emaTrend: "CONSOLIDATION",
          supportPrice: t.bid, resistancePrice: t.ask, recommendedLeverage: cls.leverage,
        });
      }
    }
  }
  return results;
}

export async function refreshLiveTickers(): Promise<LiveTicker[]> {
  cachedSymbols = null;
  return getLiveTickers();
}

export async function fetchLiveCandles(): Promise<any[]> { return []; }
