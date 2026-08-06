import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";
import { getLiveTickers } from "@/lib/market-data-service";
import { db } from "@/db";
import { botScanRuns, botStates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { finalizeAITradeDecision, requestAITradeApproval } from "@/lib/ai-trade-approval";

const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";
let scanInProgress = false;

async function mt5Order(symbol: string, type: string, volume: number, sl: number, tp: number) {
  try {
    const r = await fetch(B + "/order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, order_type: type, volume, sl, tp, comment: "Nexus AI M1 Scan" }),
    });
    return await r.json();
  } catch { return null; }
}

export async function POST(request: Request) {
  if (scanInProgress) return NextResponse.json({ success: true, skipped: true, reason: "scan_in_progress", message: "The previous M1 scan is still running." }, { status: 202 });
  scanInProgress = true;
  try {
    await getCurrentUser();
    const body = await request.json().catch(() => ({}));
    const forceExecute = body.forceExecute || false;
    const targetSymbol = body.targetSymbol;

    const tickers = await getLiveTickers();
    const assets = targetSymbol ? tickers.filter((a: any) => a.symbol === targetSymbol) : tickers;

    if (forceExecute && assets.length > 0) {
      const candleTime = assets.map((asset: any) => String(asset.candleTime || "")).filter(Boolean).sort().at(-1)
        || new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();
      const claimId = `m1:${candleTime}`;
      const claimed = await db.insert(botScanRuns).values({ id: claimId, candleTime, targetSymbol: targetSymbol || null, status: "claimed", createdAt: new Date().toISOString() }).onConflictDoNothing().returning();
      if (claimed.length === 0) {
        return NextResponse.json({ success: true, skipped: true, reason: "candle_already_scanned", scannedCount: assets.length, message: `M1 candle ${candleTime} was already scanned.` });
      }
    }

    let tradesPlaced = 0;
    let duplicatesSkipped = 0;
    let aiRejected = 0;
    let technicalFallbacks = 0;
    const aiDecisions: any[] = [];
    const executedTrades: any[] = [];

    if (forceExecute && assets.length > 0) {
      const [savedBot] = await db.select().from(botStates).where(eq(botStates.id, "bot_active"));
      const maxOpenTrades = Number(savedBot?.config?.maxOpenTrades ?? 4);
      const positionsResponse = await fetch(B + "/positions").catch(() => null);
      const positions = positionsResponse?.ok ? await positionsResponse.json() : [];
      const availableSlots = Math.max(0, maxOpenTrades - (Array.isArray(positions) ? positions.length : 0));
      const candidates = assets.filter((asset: any) =>
        asset.tradeEligible === true && asset.aiConfidence >= 80 && asset.alignmentCount >= 3
      ).slice(0, Math.min(2, availableSlots));
      for (const asset of candidates) {
        const direction = asset.trendStatus.includes("BUY") ? "BUY" : "SELL";
        const fallbackSl = direction === "BUY" ? asset.currentPrice * 0.998 : asset.currentPrice * 1.002;
        const fallbackTp = direction === "BUY" ? asset.currentPrice * 1.006 : asset.currentPrice * 0.994;
        const stopLoss = Number(asset.recommendedStopLoss || fallbackSl);
        const takeProfit = Number(asset.recommendedTakeProfit || fallbackTp);
        if (positions.some((position: any) => position.symbol === asset.symbol && position.type === direction)) { duplicatesSkipped++; continue; }
        const accountResponse = await fetch(B + "/account").catch(() => null);
        const approval = await requestAITradeApproval({
          symbol: asset.symbol, direction, price: asset.currentPrice, volume: 0.01,
          stopLoss, takeProfit,
          technicalConfidence: asset.aiConfidence, alignmentCount: asset.alignmentCount || 0,
          strategySignals: asset.strategySignals || [], account: accountResponse?.ok ? await accountResponse.json() : null,
          openPositions: positions,
        });
        aiDecisions.push(approval);
        if (!approval.approved && !approval.billingUnavailable) { aiRejected++; continue; }
        if (approval.billingUnavailable) technicalFallbacks++;
        const result = await mt5Order(asset.symbol, direction, 0.01, stopLoss, takeProfit);
        if (result?.success) {
          await finalizeAITradeDecision(approval.id, result.ticket);
          tradesPlaced++;
          executedTrades.push({ symbol: asset.symbol, ticket: result.ticket, volume: 0.01, price: asset.currentPrice, stopLoss, takeProfit, timeframe: "1m", approvalMode: approval.approved ? "ai_approved" : "technical_fallback", aiDecision: approval });
        } else if (result?.duplicate) duplicatesSkipped++;
      }
    }

    const response = NextResponse.json({
      success: true,
      scannedCount: assets.length,
      newTradesCount: tradesPlaced,
      newTrades: executedTrades,
      duplicatesSkipped,
      aiRejected,
      technicalFallbacks,
      aiDecisions,
      scanResults: assets.map((a: any) => ({ asset: a, confluence: { confluenceScore: a.aiConfidence, signal: a.trendStatus, direction: a.trendStatus.includes("BUY") ? "LONG" : a.trendStatus.includes("SELL") ? "SHORT" : "HOLD", alignmentCount: a.alignmentCount, strategySignals: a.strategySignals, tradeEligible: a.tradeEligible } })),
      message: tradesPlaced > 0
        ? "MT5 executed " + tradesPlaced + " trade(s) on Vantage!"
        : "Scanner ready — " + assets.length + " symbols. Click Force Scan to auto-trade.",
    });
    if (forceExecute && assets.length > 0) {
      const candleTime = assets.map((asset: any) => String(asset.candleTime || "")).filter(Boolean).sort().at(-1)
        || new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();
      await db.update(botScanRuns).set({ status: "completed", completedAt: new Date().toISOString() }).where(eq(botScanRuns.id, `m1:${candleTime}`));
    }
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    scanInProgress = false;
  }
}
