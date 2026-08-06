/**
 * Real-time Market Data Service — 100% MT5 bridge. No fallback data.
 */
import type { MarketAsset } from "./market-data";
import { db } from "@/db";
import { strategies } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export interface LiveTicker extends MarketAsset {
  volumeMin?: number;
  volumeStep?: number;
  strategySignals?: Array<{ name: string; family?: string; bestAsset?: string; timeframe?: string; tradingTime?: string; sessionActive?: boolean; direction: "BUY" | "SELL"; confidence: number }>;
  alignmentCount?: number;
  familyCount?: number;
  tradeEligible?: boolean;
  recommendedStopLoss?: number;
  recommendedTakeProfit?: number;
  candleTime?: string;
}

const BRIDGE = process.env.MT5_BRIDGE_URL || "http://localhost:8000";

async function bridgeCall<T = any>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(BRIDGE + path, { ...opts, cache: "no-store", signal: opts?.signal ?? AbortSignal.timeout(15_000), headers: { "Content-Type": "application/json", ...opts?.headers } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

interface SymbolMeta { name: string; volume_min: number; volume_step: number; }
let cachedSymbolMetas: SymbolMeta[] | null = null;
const SCANNER_SYMBOLS = [
  { label:"EUR/USD", candidates:["EURUSD"] }, { label:"XAU/USD", candidates:["XAUUSD"] },
  { label:"GBP/USD", candidates:["GBPUSD"] }, { label:"NAS100", candidates:["NAS100.r","NAS100"] },
  { label:"US30", candidates:["DJ30.r","US30"] }, { label:"USD/JPY", candidates:["USDJPY"] },
  { label:"SPX500", candidates:["SP500.r","SPX500","US500"] }, { label:"GER40", candidates:["GER40.r","GER40"] },
  { label:"GBP/JPY", candidates:["GBPJPY"] }, { label:"XAG/USD", candidates:["XAGUSD"] },
  { label:"EUR/JPY", candidates:["EURJPY"] }, { label:"AUD/USD", candidates:["AUDUSD"] },
  { label:"USD/CAD", candidates:["USDCAD"] }, { label:"USOIL", candidates:["USOUSD","CL-OIL","USOIL"] },
  { label:"UKOIL", candidates:["UKOUSD","UKOIL"] }, { label:"BTC/USD", candidates:["BTCUSD"] },
  { label:"ETH/USD", candidates:["ETHUSD"] }, { label:"EUR/GBP", candidates:["EURGBP"] },
  { label:"CHF/JPY", candidates:["CHFJPY"] }, { label:"JP225", candidates:["Nikkei225","JPN225ft","JP225"] },
];

async function getMT5SymbolMetas(): Promise<SymbolMeta[]> {
  if (cachedSymbolMetas) return cachedSymbolMetas;
  const data = await bridgeCall<any[]>("/symbols");
  if (data && Array.isArray(data)) {
    cachedSymbolMetas = data.map((s: any) => ({
      name: s.name, volume_min: s.volume_min ?? 0.01, volume_step: s.volume_step ?? 0.01,
    }));
    return cachedSymbolMetas;
  }
  return [];
}

function classifySymbol(sym: string): { market: "forex"|"stocks"|"crypto"; category: string; name: string; leverage: number } {
  const u = sym.toUpperCase();
  if (u.includes("XAU")||u.includes("GOLD")) return {market:"forex",category:"Precious Metals",name:"Gold Spot",leverage:100};
  if (u.includes("XAG")||u.includes("SILVER")) return {market:"forex",category:"Precious Metals",name:"Silver Spot",leverage:100};
  if (["BTC","ETH","XRP","LTC","BCH","SOL","ADA","DOT"].some(s=>u.includes(s)))
    return {market:"crypto",category:"Crypto CFD",name:sym,leverage:20};
  if (u.includes("USO")||u.includes("UKO")||u.includes("OIL")||u.includes("BRENT")||u.includes("WTI")||u==="CL-OIL") return {market:"forex",category:"Energy",name:u.includes("UKO")||u.includes("BRENT")?"Brent Crude Oil":"WTI Crude Oil",leverage:100};
  if (u.includes("NAS100")||u.includes("USTEC")||u.includes("US100")) return {market:"stocks",category:"US Index",name:"NASDAQ 100",leverage:200};
  if (u.includes("DJ30")||u.includes("US30")||u.includes("DJI")||u.includes("DOW")) return {market:"stocks",category:"US Index",name:"Dow Jones 30",leverage:200};
  if (u.includes("SP500")||u.includes("SPX500")||u.includes("US500")) return {market:"stocks",category:"US Index",name:"S&P 500",leverage:200};
  if (u.includes("NIKKEI")||u.includes("JPN225")||u.includes("JP225")) return {market:"stocks",category:"Asia Index",name:"Nikkei 225",leverage:100};
  if (["EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","NZDUSD","USDCAD","EURGBP","EURJPY","GBPJPY"].some(s=>u.includes(s)))
    return {market:"forex",category:"Major FX Pair",name:sym,leverage:500};
  if (u.includes("USD")||u.includes("JPY")||u.includes("GBP")||u.includes("EUR")||u.includes("CHF")||u.includes("AUD")||u.includes("NZD")||u.includes("CAD"))
    return {market:"forex",category:"Minor / Cross",name:sym,leverage:200};
  if (u.includes("DAX")||u.includes("GER")) return {market:"stocks",category:"EU Index",name:"DAX 40",leverage:200};
  if (u.includes("FTSE")||u.includes("UK100")) return {market:"stocks",category:"EU Index",name:"FTSE 100",leverage:200};
  if (u.includes("NGAS")||u.includes("NATGAS")) return {market:"forex",category:"Energy",name:"Natural Gas",leverage:50};
  if (["AAPL","NVDA","TSLA","MSFT","GOOG","AMZN","META"].some(s=>u.includes(s)))
    return {market:"stocks",category:"US Equity",name:sym,leverage:20};
  return {market:"forex",category:"CFD",name:sym,leverage:100};
}

export async function getLiveTickers(): Promise<LiveTicker[]> {
  const activeRows = await db.select({ name: strategies.name }).from(strategies).where(and(eq(strategies.isCustom, false), eq(strategies.isActive, true)));
  const activeNames = new Set(activeRows.map((row) => row.name));
  const allMetas = await getMT5SymbolMetas();
  const used = new Set<string>();
  const displayBySymbol = new Map<string,string>();
  const metas = SCANNER_SYMBOLS.flatMap((requested) => {
    const exact = requested.candidates.map((candidate) => allMetas.find((meta) => meta.name.toUpperCase() === candidate.toUpperCase())).find(Boolean);
    const suffixed = requested.candidates.map((candidate) => allMetas.find((meta) => meta.name.toUpperCase().startsWith(candidate.toUpperCase()))).find(Boolean);
    const match = exact || suffixed;
    if (!match || used.has(match.name)) return [];
    used.add(match.name);
    displayBySymbol.set(match.name, requested.label);
    return [match];
  });
  if (metas.length === 0) return [];
  const results: LiveTicker[] = [];
  const names = metas.map(m=>m.name);
  const metaByName = new Map(metas.map(m => [m.name, m]));
  const activelyScanned = new Set(names);
  for (let i=0;i<names.length;i+=50) {
    const batch = names.slice(i,i+50);
    const ticks = await bridgeCall<Record<string,any>>("/ticks",{method:"POST",body:JSON.stringify({symbols:batch})});
    const analysisBatch = batch.filter(symbol => activelyScanned.has(symbol));
    const analyses = analysisBatch.length
      ? await bridgeCall<Record<string,any>>("/analyses",{method:"POST",body:JSON.stringify({symbols:analysisBatch})})
      : {};
    if (ticks) {
      for (const [sym,t] of Object.entries(ticks)) {
        const meta = metaByName.get(sym);
        const cls = classifySymbol(sym);
        const analysis = analyses?.[sym];
        const allSignals = (analysis?.strategy_signals || []) as LiveTicker["strategySignals"] || [];
        const strategySignals = activeNames.size ? allSignals.filter((signal) => activeNames.has(signal.name)) : allSignals;
        const eligible = strategySignals.filter((signal) => signal.sessionActive && signal.confidence > 60);
        const buys = eligible.filter((signal) => signal.direction === "BUY");
        const sells = eligible.filter((signal) => signal.direction === "SELL");
        const aligned = buys.length >= sells.length ? buys : sells;
        const alignedDirection = buys.length >= sells.length ? "BUY" : "SELL";
        const activeConfidence = aligned.length ? Math.round(aligned.reduce((sum, signal) => sum + signal.confidence, 0) / aligned.length) : 50;
        const activeFamilies = new Set(aligned.map((signal) => signal.family || "technical")).size;
        const activeEligible = aligned.length >= 3 && activeConfidence >= 80 && aligned.some((signal) => signal.confidence >= 79);
        const activeStatus = activeEligible ? `STRONG_${alignedDirection}` : aligned.length >= 2 ? alignedDirection : "NEUTRAL";
        results.push({
          symbol:sym,displaySymbol:displayBySymbol.get(sym) || sym,name:cls.name,market:cls.market,category:cls.category,
          currentPrice:t.ask,change24h:analysis?.change_24h??0,high24h:analysis?.high_24h??t.ask,low24h:analysis?.low_24h??t.bid,
          volume24h:"MT5 ticks",volatility:analysis?.volatility??0,trendStatus:activeStatus as LiveTicker["trendStatus"],aiConfidence:activeConfidence,
          rsi:analysis?.rsi??50,macdSignal:analysis?.macd_signal??"NEUTRAL",emaTrend:analysis?.ema_trend??"CONSOLIDATION",
          supportPrice:analysis?.support??t.bid,resistancePrice:analysis?.resistance??t.ask,recommendedLeverage:cls.leverage,
          volumeMin:meta?.volume_min??0.01,volumeStep:meta?.volume_step??0.01,
          strategySignals,alignmentCount:aligned.length,
          familyCount:activeFamilies,
          tradeEligible:activeEligible,
          recommendedStopLoss:analysis?.recommended_sl,recommendedTakeProfit:analysis?.recommended_tp,
          candleTime:analysis?.candle_time,
        });
      }
    }
  }
  return results;
}

export async function refreshLiveTickers(): Promise<LiveTicker[]> {
  cachedSymbolMetas = null;
  return getLiveTickers();
}

export async function fetchLiveCandles(symbol: string, timeframe = "1h", count = 100): Promise<any[]> {
  return (await bridgeCall<any[]>(`/candles/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(timeframe)}&count=${Math.max(1, Math.min(count, 5000))}`)) || [];
}

export function getMinVolume(symbol: string): number {
  const meta = cachedSymbolMetas?.find(m=>m.name===symbol);
  return meta?.volume_min ?? 0.01;
}
