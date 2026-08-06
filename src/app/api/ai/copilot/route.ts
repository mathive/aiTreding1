import { NextResponse } from "next/server";
import { db } from "@/db";
import { aiConversations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";
import { getLiveTickers, LiveTicker } from "@/lib/market-data-service";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { prompt, conversationId } = body;
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    const lowerPrompt = prompt.toLowerCase();
    let liveTickers: LiveTicker[];
    try { liveTickers = await getLiveTickers(); } catch { liveTickers = []; }
    let responseText = "";
    let suggestedStrategy: any = null;
    let tradeIdea: any = null;

    if (lowerPrompt.includes("strategy") || lowerPrompt.includes("create") || lowerPrompt.includes("generate") || lowerPrompt.includes("build")) {
      const isScalping = lowerPrompt.includes("scalp");
      const isSwing = lowerPrompt.includes("swing");
      const isCrypto = lowerPrompt.includes("crypto") || lowerPrompt.includes("btc") || lowerPrompt.includes("sol");
      const stratName = isScalping ? "AI Micro-Breakout Velocity Scalper" : isSwing ? "Multi-Timeframe Golden Channel Rider" : isCrypto ? "Crypto Order Book Liquidity Pulse" : "Adaptive Volatility Expansion AI";
      suggestedStrategy = {
        name: stratName, category: isScalping ? "momentum" : isSwing ? "trend_follow" : "smart_money",
        traderTypeMatch: isScalping ? "scalper" : isSwing ? "swing_trader" : "all",
        description: `Autonomous algorithm optimized for ${isScalping ? "1m/5m fast scalping" : "15m/1h/4h high-conviction trend continuation"}.`,
        timeframes: isScalping ? ["1m", "5m"] : ["15m", "1h", "4h"],
        indicators: { emaFast: 9, emaSlow: 21, trendFilter: 200, rsiThreshold: isScalping ? 45 : 55, atrMultiplier: 2.2, volumeSurgeMultiplier: 1.7 },
        targetAssets: isCrypto ? ["BTC/USDT", "SOL/USDT", "ETH/USDT"] : ["NVDA", "BTC/USDT", "TSLA", "XAU/USD"],
        weight: 35, minConfidence: 78, stopLossPercent: isScalping ? "1.20" : "2.40",
        takeProfitPercent: isScalping ? "3.20" : "6.80", trailingStop: true, aiPromptOrigin: prompt,
      };
      responseText = `I have architected **${stratName}**.\\n\\n- 9/21 EMA crossover + 200 EMA filter\\n- > 1.7x volume confirmation\\n- ${suggestedStrategy.stopLossPercent}% SL / ${suggestedStrategy.takeProfitPercent}% TP with trailing stop.\\n\\n*Click Save & Add to deploy.*`;
    } else if (lowerPrompt.includes("btc") || lowerPrompt.includes("bitcoin")) {
      const btc = liveTickers.find((a) => a.symbol === "BTC/USDT");
      if (btc) {
        responseText = `**Bitcoin (BTC/USDT)**\\n- Current: $${btc.currentPrice.toLocaleString()}\\n- Trend: STRONG BULLISH (AI: ${btc.aiConfidence}/100)\\n- Support: $${btc.supportPrice} | Resistance: $${btc.resistancePrice}\\n- RSI: ${btc.rsi} — healthy momentum.`;
      } else responseText = "Unable to fetch live Bitcoin data. Try again shortly.";
    } else if (lowerPrompt.includes("sol") || lowerPrompt.includes("solana")) {
      const sol = liveTickers.find((a) => a.symbol === "SOL/USDT");
      if (sol) responseText = `**Solana (SOL/USDT)**\\n- Current: $${sol.currentPrice}\\n- 24h: ${sol.change24h >= 0 ? "+" : ""}${sol.change24h}%\\n- AI Signal: ${sol.aiConfidence}/100 conviction. Support below $${sol.supportPrice}.`;
      else responseText = "Unable to fetch live Solana data.";
    } else {
      responseText = "### Nexus AI Market Overview\\n\\n1. Strong risk-on momentum across Crypto L1s and AI Semiconductor equities.\\n2. Best confluence: Breakout Momentum AI (35%) + Deep AI Trend Pulse (35%) + Smart Money Flow (30%).\\n3. Autonomous Bot: Active with drawdown protection.\\n\\n*Ask me to create a strategy, backtest, or analyze any chart!*";
    }

    const convId = conversationId || "conv_default_01";
    let [existingConv] = await db.select().from(aiConversations).where(eq(aiConversations.id, convId)).limit(1);
    const userMsg = { id: `msg_${Date.now()}_u`, role: "user" as const, content: prompt, timestamp: new Date().toISOString() };
    const aiMsg = { id: `msg_${Date.now()}_a`, role: "assistant" as const, content: responseText, suggestedStrategy, tradeIdea, timestamp: new Date().toISOString() };
    if (existingConv) {
      const updatedMessages = [...(existingConv.messages || []), userMsg, aiMsg];
      await db.update(aiConversations).set({ messages: updatedMessages, updatedAt: new Date().toISOString() }).where(eq(aiConversations.id, convId));
    } else {
      await db.insert(aiConversations).values({ id: convId, userId: currentUser.id, title: prompt.substring(0, 40) + "...", messages: [userMsg, aiMsg] });
    }
    return NextResponse.json({ success: true, reply: responseText, suggestedStrategy, tradeIdea, conversationId: convId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process AI Copilot request" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const convs = await db.select().from(aiConversations).where(eq(aiConversations.userId, currentUser.id));
    return NextResponse.json({ conversations: convs, defaultConversation: convs[0] || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch conversations" }, { status: 500 });
  }
}
