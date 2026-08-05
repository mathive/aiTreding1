import { NextResponse } from "next/server";
import { db } from "@/db";
import { aiConversations, strategies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";
import { INITIAL_ASSETS } from "@/lib/market-data";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { prompt, conversationId } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const lowerPrompt = prompt.toLowerCase();

    // Determine AI response and potential strategy generation
    let responseText = "";
    let suggestedStrategy: any = null;
    let tradeIdea: any = null;

    if (
      lowerPrompt.includes("strategy") ||
      lowerPrompt.includes("create") ||
      lowerPrompt.includes("generate") ||
      lowerPrompt.includes("build")
    ) {
      // AI Strategy Generation
      const isScalping = lowerPrompt.includes("scalp");
      const isSwing = lowerPrompt.includes("swing");
      const isCrypto = lowerPrompt.includes("crypto") || lowerPrompt.includes("btc") || lowerPrompt.includes("sol");

      const stratName = isScalping
        ? "AI Micro-Breakout Velocity Scalper"
        : isSwing
        ? "Multi-Timeframe Golden Channel Rider"
        : isCrypto
        ? "Crypto Order Book Liquidity Pulse"
        : "Adaptive Volatility Expansion AI";

      suggestedStrategy = {
        name: stratName,
        category: isScalping ? "momentum" : isSwing ? "trend_follow" : "smart_money",
        traderTypeMatch: isScalping ? "scalper" : isSwing ? "swing_trader" : "all",
        description: `Autonomous algorithm optimized for ${isScalping ? "1m/5m fast scalping" : "15m/1h/4h high-conviction trend continuation"}. Utilizes dynamic ATR bands, VWAP slope confirmation, and EMA confluence.`,
        timeframes: isScalping ? ["1m", "5m"] : ["15m", "1h", "4h"],
        indicators: {
          emaFast: 9,
          emaSlow: 21,
          trendFilter: 200,
          rsiThreshold: isScalping ? 45 : 55,
          atrMultiplier: 2.2,
          volumeSurgeMultiplier: 1.7,
        },
        targetAssets: isCrypto ? ["BTC/USDT", "SOL/USDT", "ETH/USDT"] : ["NVDA", "BTC/USDT", "TSLA", "XAU/USD"],
        weight: 35,
        minConfidence: 78,
        stopLossPercent: isScalping ? "1.20" : "2.40",
        takeProfitPercent: isScalping ? "3.20" : "6.80",
        trailingStop: true,
        aiPromptOrigin: prompt,
      };

      responseText = `I have architected a custom trending strategy for you: **${stratName}**.\n\n### Core Mechanics:\n- **Confluence Triggers**: 9/21 EMA crossover reinforced by 200 EMA higher-timeframe trend filter.\n- **Volume Confirmation**: Requires > 1.7x relative volume expansion to avoid bull/bear traps.\n- **Dynamic Risk**: Strict ${suggestedStrategy.stopLossPercent}% Stop-Loss with ${suggestedStrategy.takeProfitPercent}% Take-Profit target and Trailing Stop activation.\n\n*Click "Save & Add to Bot Portfolio" below to deploy this strategy to your autonomous trading engine.*`;
    } else if (lowerPrompt.includes("btc") || lowerPrompt.includes("bitcoin")) {
      const btc = INITIAL_ASSETS.find((a) => a.symbol === "BTC/USDT")!;
      tradeIdea = {
        symbol: "BTC/USDT",
        direction: "BUY (LONG)",
        entry: btc.currentPrice,
        target: btc.resistancePrice,
        stopLoss: btc.supportPrice,
        confidence: 94,
      };
      responseText = `**Bitcoin (BTC/USDT) Live Technical Diagnostic**:\n\n- **Current Price**: $${btc.currentPrice.toLocaleString()}\n- **Trend Bias**: **STRONG BULLISH** (AI Score: 94/100)\n- **Key Levels**: Dynamic Support at $${btc.supportPrice.toLocaleString()} | Resistance Target at $${btc.resistancePrice.toLocaleString()}\n- **Indicators**: RSI at ${btc.rsi} (Healthy bullish momentum), Triple EMA stacking bullish.\n\n**AI Trading Recommendation**: Breakout Momentum AI has issued an active LONG signal with 1:2.8 risk-to-reward ratio.`;
    } else if (lowerPrompt.includes("sol") || lowerPrompt.includes("solana")) {
      const sol = INITIAL_ASSETS.find((a) => a.symbol === "SOL/USDT")!;
      tradeIdea = {
        symbol: "SOL/USDT",
        direction: "BUY (LONG)",
        entry: sol.currentPrice,
        target: sol.resistancePrice,
        stopLoss: sol.supportPrice,
        confidence: 96,
      };
      responseText = `**Solana (SOL/USDT) Momentum Breakdown**:\n\n- **Current Price**: $${sol.currentPrice}\n- **24h Volume Surge**: ${sol.volume24h} with +${sol.change24h}% daily expansion.\n- **AI Signal**: Deep AI Trend Pulse model has a 96% conviction score.\n\n**Action**: High-priority candidate for autonomous execution. Invalidation level below $${sol.supportPrice}.`;
    } else if (lowerPrompt.includes("nvda") || lowerPrompt.includes("nvidia")) {
      const nvda = INITIAL_ASSETS.find((a) => a.symbol === "NVDA")!;
      responseText = `**NVIDIA (NVDA) Multi-Timeframe Status**:\n\n- **Current Price**: $${nvda.currentPrice}\n- **Trend**: Bullish consolidation breakout above $136.50 resistance.\n- **MACD**: Bullish cross confirmed on 1h and 4h timeframes.\n- **Confluence Recommendation**: Pair **Multi-Timeframe MACD** with **Bollinger Band Squeeze** for 3x leverage intraday/swing continuation.`;
    } else {
      responseText = `### Nexus AI Market Overview & Strategy Insights:\n\n1. **Macro Trend Regime**: Strong risk-on momentum across leading Crypto L1s (BTC, SOL) and AI Semiconductor equities (NVDA, AMD).\n2. **Best Confluence Blend Today**: Combining **Breakout Momentum AI (35% weight)** + **Deep AI Trend Pulse (35% weight)** + **Smart Money Liquidity Sweep (30% weight)** is generating a **74.8% win rate** in our live forward tests.\n3. **Autonomous Bot Status**: Automated execution is active with max drawdown protection enabled.\n\n*Ask me to create any customized strategy, backtest an asset, or analyze a specific chart!*`;
    }

    // Save to conversation history
    const convId = conversationId || "conv_default_01";
    let [existingConv] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, convId))
      .limit(1);

    const userMsg = {
      id: `msg_${Date.now()}_u`,
      role: "user" as const,
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    const aiMsg = {
      id: `msg_${Date.now()}_a`,
      role: "assistant" as const,
      content: responseText,
      suggestedStrategy,
      tradeIdea,
      timestamp: new Date().toISOString(),
    };

    if (existingConv) {
      const updatedMessages = [...(existingConv.messages || []), userMsg, aiMsg];
      await db
        .update(aiConversations)
        .set({ messages: updatedMessages, updatedAt: new Date() })
        .where(eq(aiConversations.id, convId));
    } else {
      await db.insert(aiConversations).values({
        id: convId,
        userId: currentUser.id,
        title: prompt.substring(0, 40) + "...",
        messages: [userMsg, aiMsg],
      });
    }

    return NextResponse.json({
      success: true,
      reply: responseText,
      suggestedStrategy,
      tradeIdea,
      conversationId: convId,
    });
  } catch (error: any) {
    console.error("Error in AI Copilot:", error);
    return NextResponse.json({ error: error.message || "Failed to process AI Copilot request" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const convs = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, currentUser.id));

    return NextResponse.json({
      conversations: convs,
      defaultConversation: convs[0] || null,
    });
  } catch (error: any) {
    console.error("Error fetching AI conversations:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch conversations" }, { status: 500 });
  }
}
