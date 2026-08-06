import { NextResponse } from "next/server";
import { db } from "@/db";
import { botConfigs, strategies, trades, notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";
import { refreshLiveTickers } from "@/lib/market-data-service";
import { evaluateMultiStrategyConfluence, MarketAsset } from "@/lib/market-data";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json().catch(() => ({}));
    const forceExecute = body.forceExecute || false;
    const targetSymbol = body.targetSymbol;
    let [bot] = await db.select().from(botConfigs).where(eq(botConfigs.userId, currentUser.id)).limit(1);
    if (!bot) { const defaultBots = await db.select().from(botConfigs).limit(1); bot = defaultBots[0]; }
    const allStrategies = await db.select().from(strategies);
    // Parse JSON fields from SQLite if they come back as strings
    let sids: any[] = [];
    if (bot?.selectedStrategyIds) {
      try { sids = typeof bot.selectedStrategyIds === "string" ? JSON.parse(bot.selectedStrategyIds) : bot.selectedStrategyIds; } catch { sids = []; }
    }
    const activeStrategyIds = (Array.isArray(sids) ? sids : []).map((s: any) => s.strategyId);
    const activeStrategies = allStrategies.filter((s) => activeStrategyIds.includes(s.id) || (s.isActive && activeStrategyIds.length === 0));
    const openTrades = await db.select().from(trades).where(and(eq(trades.userId, currentUser.id), eq(trades.status, "OPEN")));
    const openSymbols = new Set(openTrades.map((t) => t.symbol));
    const maxTradesAllowed = bot?.maxOpenTrades || 4;
    const confluenceThreshold = bot?.confluenceThreshold || 75;
    const leverage = bot?.defaultLeverage || 5;
    const liveTickers: MarketAsset[] = await refreshLiveTickers();
    const assetsToScan = targetSymbol ? liveTickers.filter((a) => a.symbol === targetSymbol) : liveTickers;
    const scanResults = assetsToScan.map((asset) => {
      const evalResult = evaluateMultiStrategyConfluence(asset, activeStrategies);
      return { asset, confluence: evalResult };
    });
    const newTradesExecuted: any[] = [];
    const notificationsGenerated: any[] = [];

    for (const trade of openTrades) {
      const liveAsset = liveTickers.find((a) => a.symbol === trade.symbol);
      if (!liveAsset) continue;
      const currentPrice = liveAsset.currentPrice;
      const entryPrice = Number(trade.entryPrice);
      const tradeAmount = Number(trade.amount);
      const tradeLeverage = trade.leverage || 1;
      let pnlPercent = 0;
      if (trade.type === "BUY") pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100 * tradeLeverage;
      else pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100 * tradeLeverage;
      const pnl = (tradeAmount * pnlPercent) / 100;
      const tp = trade.takeProfit ? Number(trade.takeProfit) : null;
      const sl = trade.stopLoss ? Number(trade.stopLoss) : null;
      let shouldClose = false, closeReason = "";
      if (trade.type === "BUY") {
        if (tp && currentPrice >= tp) { shouldClose = true; closeReason = "take_profit"; }
        else if (sl && currentPrice <= sl) { shouldClose = true; closeReason = "stop_loss"; }
      } else {
        if (tp && currentPrice <= tp) { shouldClose = true; closeReason = "take_profit"; }
        else if (sl && currentPrice >= sl) { shouldClose = true; closeReason = "stop_loss"; }
      }
      if (shouldClose) {
        await db.update(trades).set({ status: "CLOSED", exitPrice: String(currentPrice.toFixed(4)), currentPrice: String(currentPrice.toFixed(4)), pnl: String(pnl.toFixed(2)), pnlPercent: String(pnlPercent.toFixed(2)), exitTime: new Date().toISOString(), closeReason, updatedAt: new Date().toISOString() }).where(eq(trades.id, trade.id));
        const currentBal = Number(currentUser.balance);
        const newBal = currentBal + tradeAmount + pnl;
        await db.update(users).set({ balance: String(newBal.toFixed(2)), updatedAt: new Date().toISOString() }).where(eq(users.id, currentUser.id));
        const notifTitle = closeReason === "take_profit" ? `🎯 Take-Profit Hit on ${trade.symbol}!` : `🛡️ Stop-Loss Triggered on ${trade.symbol}`;
        const [notif] = await db.insert(notifications).values({ id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, userId: currentUser.id, title: notifTitle, message: `Position closed at $${currentPrice.toFixed(2)}. Net PnL: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%).`, type: closeReason === "take_profit" ? "tp_hit" : "sl_hit", isRead: false, metadata: { tradeId: trade.id, symbol: trade.symbol, pnl, pnlPercent } }).returning();
        notificationsGenerated.push(notif);
      } else {
        await db.update(trades).set({ currentPrice: String(currentPrice.toFixed(4)), pnl: String(pnl.toFixed(2)), pnlPercent: String(pnlPercent.toFixed(2)), updatedAt: new Date().toISOString() }).where(eq(trades.id, trade.id));
      }
    }

    const canTakeNewTrades = (bot?.isActive || forceExecute) && (currentUser.autoTradingEnabled || forceExecute) && openTrades.length < maxTradesAllowed;
    if (canTakeNewTrades) {
      const highConfluenceCandidates = scanResults.filter((res) => !openSymbols.has(res.asset.symbol) && res.confluence.confluenceScore >= confluenceThreshold && (res.confluence.signal === "STRONG_BUY" || res.confluence.signal === "BUY" || forceExecute)).sort((a, b) => b.confluence.confluenceScore - a.confluence.confluenceScore);
      const availableSlots = maxTradesAllowed - openTrades.length;
      const candidatesToTrade = highConfluenceCandidates.slice(0, Math.min(availableSlots, 1));
      for (const candidate of candidatesToTrade) {
        const { asset, confluence } = candidate;
        const balance = Number(currentUser.balance);
        let tradeAmount = 2500;
        if (bot?.tradeAllocationType === "percent") { const pct = Number(bot.tradeAllocationValue) || 5; tradeAmount = Math.max(500, Math.round((balance * pct) / 100)); }
        else if (bot?.tradeAllocationType === "fixed") { tradeAmount = Math.min(balance * 0.25, Number(bot.tradeAllocationValue) || 2000); }
        const quantity = tradeAmount / asset.currentPrice;
        const stratNames = activeStrategies.map((s) => s.name).slice(0, 2).join(" + ") || "Multi-Strategy AI";
        const newTradeId = `trade_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const [createdTrade] = await db.insert(trades).values({ id: newTradeId, userId: currentUser.id, botConfigId: bot?.id, symbol: asset.symbol, market: asset.market, type: confluence.direction === "SHORT" ? "SELL" : "BUY", status: "OPEN", entryPrice: String(asset.currentPrice), currentPrice: String(asset.currentPrice), quantity: String(quantity.toFixed(6)), amount: String(tradeAmount.toFixed(2)), leverage, stopLoss: String(confluence.stopLossPrice), takeProfit: String(confluence.targetPriceTP1), trailingStop: true, trailingDistance: "2.00", pnl: "0.00", pnlPercent: "0.00", strategyUsed: `Multi-Strategy Confluence (${stratNames})`, strategyConfluence: confluence.strategyBreakdowns.map((s) => ({ name: s.strategyName, weight: s.weight, signal: s.signal, score: s.score })), aiConfidence: confluence.confluenceScore, aiReasoning: confluence.aiSummary, executionType: "ai_autonomous", entryTime: new Date().toISOString() }).returning();
        newTradesExecuted.push(createdTrade);
        const updatedBal = balance - tradeAmount;
        await db.update(users).set({ balance: String(updatedBal.toFixed(2)), updatedAt: new Date().toISOString() }).where(eq(users.id, currentUser.id));
        const [notif] = await db.insert(notifications).values({ id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, userId: currentUser.id, title: `🤖 AI Trade Executed: ${asset.symbol} ${confluence.direction}`, message: `Nexus AI entered position at $${asset.currentPrice.toFixed(2)} with ${confluence.confluenceScore}% confluence. TP: $${confluence.targetPriceTP1}, SL: $${confluence.stopLossPrice}.`, type: "trade_executed", isRead: false, metadata: { tradeId: createdTrade.id, symbol: asset.symbol, score: confluence.confluenceScore, amount: tradeAmount } }).returning();
        notificationsGenerated.push(notif);
      }
    }
    if (bot) { await db.update(botConfigs).set({ lastScanAt: new Date().toISOString(), totalBotTrades: (bot.totalBotTrades || 0) + newTradesExecuted.length, updatedAt: new Date().toISOString() }).where(eq(botConfigs.id, bot.id)); }
    return NextResponse.json({ success: true, scannedCount: scanResults.length, newTradesCount: newTradesExecuted.length, newTrades: newTradesExecuted, scanResults, notifications: notificationsGenerated, message: newTradesExecuted.length > 0 ? `Nexus AI evaluated markets and executed ${newTradesExecuted.length} high-confluence trade(s)!` : `Market scan complete. ${scanResults.filter((s) => s.confluence.confluenceScore >= confluenceThreshold).length} asset(s) above threshold.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to run scan and trade" }, { status: 500 });
  }
}
