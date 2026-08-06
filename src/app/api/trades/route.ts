import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";

export async function GET() {
  try {
    await getCurrentUser();
    const r = await fetch(B + "/positions", { headers: { "Content-Type": "application/json" } }).catch(() => null);
    if (!r || !r.ok) return NextResponse.json({ trades: [], stats: { totalTrades: 0, openCount: 0, source: "mt5_offline" } });
    const pos = await r.json();
    if (!Array.isArray(pos)) return NextResponse.json({ trades: [], stats: { totalTrades: 0, openCount: 0, source: "mt5_empty" } });
    const trades = pos.map((p: any) => ({
      id: "mt5_" + p.ticket, symbol: p.symbol, type: p.type||"BUY", status: "OPEN",
      entryPrice: String(p.open_price||0), currentPrice: String(p.current_price||0),
      quantity: String(p.volume||0), amount: String((p.volume||0)*(p.open_price||0)),
      leverage: 0, stopLoss: p.sl?String(p.sl):null, takeProfit: p.tp?String(p.tp):null,
      trailingStop: false, pnl: String(p.profit||0),
      pnlPercent: p.current_price&&p.open_price?String(((p.current_price-p.open_price)/(p.open_price)*100).toFixed(2)):"0",
      strategyUsed: "MT5 Vantage", aiConfidence: 50, aiReasoning: "Live MT5 position",
      executionType: "mt5", entryTime: String(p.open_time||new Date().toISOString()),
    }));
    const openPnl = trades.reduce((a,t)=>a+Number(t.pnl||0),0);
    return NextResponse.json({ trades, stats: { totalTrades: trades.length, openCount: trades.length, totalOpenPnl: Number(openPnl.toFixed(2)), source: "mt5_live" } });
  } catch { return NextResponse.json({ trades: [], stats: { totalTrades: 0, openCount: 0 } }); }
}

export async function POST(request: Request) {
  try {
    await getCurrentUser();
    const { symbol, type="BUY", amount: vol } = await request.json();
    if (!symbol||!vol) return NextResponse.json({ error:"Symbol and volume required" },{status:400});
    const r = await fetch(B+"/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbol,order_type:type,volume:Number(vol),sl:0,tp:0,comment:"Nexus AI"})});
    const d = await r.json();
    if (d?.success) return NextResponse.json({ success:true, ticket:d.ticket, message:`MT5 order #${d.ticket} placed` });
    return NextResponse.json({ success:false, error:d?.error||"Order failed" },{status:502});
  } catch (e: any) { return NextResponse.json({ error: e.message },{status:500}); }
}
