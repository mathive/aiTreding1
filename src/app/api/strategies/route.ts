import { NextResponse } from "next/server";
import { db } from "@/db";
import { strategies } from "@/db/schema";

const baseStrategies = [
  ["s1","London Breakout","GBP/USD · 07:00-10:00 UTC","breakout",["1m","5m"],["GBPUSD"]],
  ["s2","New York Breakout","EUR/USD · 12:30-15:00 UTC","breakout",["1m","5m"],["EURUSD"]],
  ["s3","London-New York Overlap Scalping","EUR/USD · 12:30-16:00 UTC","scalping",["1m"],["EURUSD"]],
  ["s4","Order Block + BOS","GBP/USD · London and New York","smart_money",["1m","5m","15m"],["GBPUSD"]],
  ["s5","Liquidity Sweep (ICT/SMC)","EUR/USD · London Open","smart_money",["1m","5m"],["EURUSD"]],
  ["s6","Fair Value Gap (FVG)","EUR/USD · London and New York","smart_money",["1m","5m"],["EURUSD"]],
  ["s7","EMA 20/50 Pullback","EUR/USD · Any trending session","trend_follow",["5m"],["EURUSD"]],
  ["s8","EMA 200 Trend Scalping","USD/JPY · Tokyo and London","scalping",["1m"],["USDJPY"]],
  ["s9","Supertrend Scalping","XAU/USD · London","scalping",["1m"],["XAUUSD"]],
  ["s10","VWAP Reversal","XAU/USD · New York Open","mean_reversion",["1m"],["XAUUSD"]],
  ["s11","Bollinger Band Reversal","EUR/USD · Asian session","mean_reversion",["5m"],["EURUSD"]],
  ["s12","RSI Hidden Divergence","AUD/USD · London","momentum",["5m","15m"],["AUDUSD"]],
  ["s13","MACD Trend Continuation","EUR/USD · London","momentum",["15m"],["EURUSD"]],
  ["s14","Donchian Channel Breakout","GBP/JPY · London","breakout",["5m"],["GBPJPY"]],
  ["s15","ATR Breakout","GBP/USD · High volatility","breakout",["5m"],["GBPUSD"]],
  ["s16","Opening Range Breakout (ORB)","XAU/USD · New York Open","breakout",["1m"],["XAUUSD"]],
  ["s17","Turtle Breakout","USD/JPY · London","breakout",["15m"],["USDJPY"]],
  ["s18","Keltner Channel Pullback","EUR/USD · London","trend_follow",["5m"],["EURUSD"]],
  ["s19","Mean Reversion","EUR/CHF · Asian session","mean_reversion",["5m"],["EURCHF"]],
  ["s20","Multi-Timeframe Trend Following","EUR/USD · H1 trend with M5 entry · London and New York","trend_follow",["1h","5m"],["EURUSD"]],
] as Array<[string,string,string,string,string[],string[]]>;

const defaults = baseStrategies.map(([id,name,description,category,timeframes,targetAssets],index) => ({
  id,name,description,category,timeframes,targetAssets,weight:Math.max(20,60-index),minConfidence:61,
  stopLossPercent:"0.20",takeProfitPercent:"0.60",trailingStop:true,isActive:true,
}));

async function ensureDefaults() {
  for (const item of defaults) {
    const now = new Date().toISOString();
    await db.insert(strategies).values({ ...item, userId: "default", indicators: {}, winRate: "0", totalTradesCount: 0, profitFactor: "0", isCustom: false, createdAt: now, updatedAt: now }).onConflictDoUpdate({
      target: strategies.id,
      set: { name: item.name, description: item.description, category: item.category, timeframes: item.timeframes, targetAssets: item.targetAssets, weight: item.weight, minConfidence: item.minConfidence, stopLossPercent: item.stopLossPercent, takeProfitPercent: item.takeProfitPercent, updatedAt: now },
    });
  }
}

export async function GET() {
  await ensureDefaults();
  return NextResponse.json({ strategies: await db.select().from(strategies) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const [created] = await db.insert(strategies).values({
      id: crypto.randomUUID(), userId: "default", name: body.name || "Custom Strategy",
      description: body.description || "", category: body.category || "custom",
      timeframes: body.timeframes || ["1m"], indicators: body.indicators || {}, targetAssets: body.targetAssets || [],
      weight: Number(body.weight ?? 30), minConfidence: Number(body.minConfidence ?? 75),
      stopLossPercent: String(body.stopLossPercent ?? "0.20"), takeProfitPercent: String(body.takeProfitPercent ?? "0.60"),
      trailingStop: Boolean(body.trailingStop ?? true), isActive: Boolean(body.isActive ?? true),
      winRate: "0", totalTradesCount: 0, profitFactor: "0", isCustom: true, createdAt: now, updatedAt: now,
    }).returning();
    return NextResponse.json({ success: true, strategy: created }, { status: 201 });
  } catch (error: any) { return NextResponse.json({ error: error.message || "Failed to create strategy" }, { status: 500 }); }
}
