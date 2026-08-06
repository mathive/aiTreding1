import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";
import { getLiveTickers } from "@/lib/market-data-service";
import { finalizeAITradeDecision, requestAITradeApproval } from "@/lib/ai-trade-approval";
import { db } from "@/db";
import { aiTradeDecisions } from "@/db/schema";
import { desc } from "drizzle-orm";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";

function isAutonomousAIComment(comment: unknown) {
  const value = String(comment || "").toLowerCase();
  return value.includes("nexus ai scan") || value.includes("nexus ai m1 scan");
}

export async function GET() {
  try {
    await getCurrentUser();
    const [r, historyResponse] = await Promise.all([
      fetch(B + "/positions", { headers: { "Content-Type": "application/json" }, cache: "no-store" }).catch(() => null),
      fetch(B + "/history?days=365", { headers: { "Content-Type": "application/json" }, cache: "no-store" }).catch(() => null),
    ]);
    if (!r || !r.ok) return NextResponse.json({ trades: [], stats: { totalTrades: 0, openCount: 0, source: "mt5_offline" } });
    const pos = await r.json();
    if (!Array.isArray(pos)) return NextResponse.json({ trades: [], stats: { totalTrades: 0, openCount: 0, source: "mt5_empty" } });
    const decisions = await db.select().from(aiTradeDecisions).orderBy(desc(aiTradeDecisions.createdAt));
    const open = pos.map((p: any) => {
      const decision = decisions.find((item) => item.executed && (item.orderTicket === String(p.ticket) || (item.symbol === p.symbol && item.direction === p.type)));
      return ({
      id: "mt5_" + p.ticket, symbol: p.symbol, type: p.type||"BUY", status: "OPEN",
      entryPrice: String(p.open_price||0), currentPrice: String(p.current_price||0),
      quantity: String(p.volume||0), amount: String((p.volume||0)*(p.open_price||0)),
      leverage: 0, stopLoss: p.sl?String(p.sl):null, takeProfit: p.tp?String(p.tp):null,
      trailingStop: false, pnl: String(p.profit||0),
      pnlPercent: p.current_price&&p.open_price?String((((p.type === "SELL" ? -1 : 1)*(p.current_price-p.open_price))/(p.open_price)*100).toFixed(2)):"0",
      strategyUsed: isAutonomousAIComment(p.comment) ? "Multi-Strategy Confluence" : "MT5 Vantage",
      aiConfidence: decision?.confidence ?? (isAutonomousAIComment(p.comment) ? 80 : 50),
      aiReasoning: decision ? `AI ${decision.verdict} (${decision.confidence}%): ${decision.reason}` : p.comment || "Live MT5 position",
      executionType: isAutonomousAIComment(p.comment) ? "ai_autonomous" : "mt5",
      entryTime: String(p.open_time||new Date().toISOString()),
    }); });
    const history = historyResponse?.ok ? await historyResponse.json() : { deals: [] };
    const groups = new Map<number, any[]>();
    for (const deal of Array.isArray(history.deals) ? history.deals : []) {
      const positionId = Number(deal.position_id || deal.ticket);
      groups.set(positionId, [...(groups.get(positionId) || []), deal]);
    }
    const closed = [...groups.entries()].flatMap(([positionId, deals]) => {
      // Only autonomous scanner entries belong in AI Closed History. Manual MT5
      // orders and manually submitted app orders are deliberately excluded.
      const isBot = deals.some((deal) => isAutonomousAIComment(deal.comment));
      const entry = [...deals].reverse().find((deal) => Number(deal.entry) === 0);
      const exit = deals.find((deal) => Number(deal.entry) !== 0);
      if (!isBot || !entry || !exit || open.some((trade: any) => trade.id === `mt5_${positionId}`)) return [];
      const pnl = deals.reduce((sum, deal) => sum + Number(deal.profit||0) + Number(deal.commission||0) + Number(deal.swap||0), 0);
      return [{
        id:`mt5_closed_${positionId}`, userId:"default", symbol:entry.symbol, type:entry.type||"BUY", status:"CLOSED",
        entryPrice:String(entry.price||0), exitPrice:String(exit.price||0), currentPrice:String(exit.price||0),
        quantity:String(entry.volume||0), amount:String((entry.volume||0)*(entry.price||0)), leverage:0,
        stopLoss:null, takeProfit:null, trailingStop:false, pnl:String(pnl), pnlPercent:"0",
        strategyUsed:"Multi-Strategy Confluence", aiConfidence:80,
        aiReasoning:"Recovered from MT5 autonomous execution history", executionType:"ai_autonomous",
        entryTime:String(entry.time), exitTime:String(exit.time), closeReason:"MT5 closed",
      }];
    });
    const trades = [...open, ...closed];
    const openPnl = open.reduce((a: number,t: any)=>a+Number(t.pnl||0),0);
    return NextResponse.json({ trades, stats: { totalTrades: trades.length, openCount: open.length, closedCount: closed.length, totalOpenPnl: Number(openPnl.toFixed(2)), source: "mt5_live" } });
  } catch { return NextResponse.json({ trades: [], stats: { totalTrades: 0, openCount: 0 } }); }
}

export async function POST(request: Request) {
  try {
    await getCurrentUser();
    const { symbol, type="BUY", amount: vol, stopLoss, takeProfit } = await request.json();
    if (!symbol||!vol) return NextResponse.json({ error:"Symbol and volume required" },{status:400});
    const asset = (await getLiveTickers()).find((item) => item.symbol === symbol);
    if (!asset) return NextResponse.json({ error: "No live MT5 signal is available for this symbol" }, { status: 400 });
    if (!asset.tradeEligible || asset.aiConfidence < 80 || (asset.alignmentCount ?? 0) < 3) {
      return NextResponse.json({ error: `${symbol} does not meet the 3-strategy / 80% confluence trade gate` }, { status: 409 });
    }
    const requiredType = asset.trendStatus.includes("BUY") ? "BUY" : asset.trendStatus.includes("SELL") ? "SELL" : null;
    if (!requiredType) return NextResponse.json({ error: `${symbol} has a NEUTRAL signal; trading is disabled` }, { status: 409 });
    if (String(type).toUpperCase() !== requiredType) return NextResponse.json({ error: `${symbol} signal requires ${requiredType}; ${type} is not allowed` }, { status: 409 });
    const enforcedStopLoss = Number(stopLoss) || asset.currentPrice * (requiredType === "BUY" ? 0.998 : 1.002);
    const riskDistance = Math.abs(asset.currentPrice - enforcedStopLoss);
    const enforcedTakeProfit = asset.currentPrice + (requiredType === "BUY" ? 1 : -1) * riskDistance * 3;
    const [accountResponse, positionsResponse] = await Promise.all([fetch(B + "/account"), fetch(B + "/positions")]);
    const approval = await requestAITradeApproval({
      symbol, direction: requiredType, price: asset.currentPrice, volume: Number(vol),
      stopLoss: enforcedStopLoss, takeProfit: enforcedTakeProfit,
      technicalConfidence: asset.aiConfidence, alignmentCount: asset.alignmentCount || 0,
      strategySignals: asset.strategySignals || [],
      account: accountResponse.ok ? await accountResponse.json() : null,
      openPositions: positionsResponse.ok ? await positionsResponse.json() : [],
    });
    if (!approval.approved && !approval.billingUnavailable) return NextResponse.json({ error: `AI ${approval.verdict}: ${approval.reason}`, aiDecision: approval }, { status: 409 });
    const approvalMode = approval.approved ? "ai_approved" : "technical_fallback";
    const r = await fetch(B+"/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbol,order_type:type,volume:Number(vol),sl:enforcedStopLoss,tp:enforcedTakeProfit,comment:"Nexus AI Manual"})});
    const d = await r.json();
    if (d?.success) { await finalizeAITradeDecision(approval.id, d.ticket); return NextResponse.json({ success:true, ticket:d.ticket, aiDecision:approval, approvalMode, message:approval.approved ? `MT5 order #${d.ticket} placed after AI approval` : `MT5 order #${d.ticket} placed using strict technical fallback` }); }
    if (d?.duplicate) return NextResponse.json({ success:false, duplicate:true, skipped:true, existing:d.existing, error:d.error }, {status:409});
    return NextResponse.json({ success:false, error:d?.error||"Order failed" },{status:502});
  } catch (e: any) { return NextResponse.json({ error: e.message },{status:500}); }
}
