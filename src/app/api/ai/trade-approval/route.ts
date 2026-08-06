import { NextResponse } from "next/server";
import { getLiveTickers } from "@/lib/market-data-service";
import { requestAITradeApproval } from "@/lib/ai-trade-approval";

const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const asset = (await getLiveTickers()).find((item) => item.symbol === body.symbol);
    if (!asset) return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
    const direction = asset.trendStatus.includes("BUY") ? "BUY" : asset.trendStatus.includes("SELL") ? "SELL" : null;
    if (!direction || !asset.tradeEligible) return NextResponse.json({ error: "Technical trade gate did not pass" }, { status: 409 });
    const [accountResponse, positionsResponse] = await Promise.all([fetch(B + "/account"), fetch(B + "/positions")]);
    const decision = await requestAITradeApproval({
      symbol: asset.symbol, direction, price: asset.currentPrice, volume: Number(body.volume || 0.01),
      stopLoss: Number(body.stopLoss || 0), takeProfit: Number(body.takeProfit || 0),
      technicalConfidence: asset.aiConfidence, alignmentCount: asset.alignmentCount || 0,
      strategySignals: asset.strategySignals || [], account: accountResponse.ok ? await accountResponse.json() : null,
      openPositions: positionsResponse.ok ? await positionsResponse.json() : [],
    });
    return NextResponse.json({ dryRun: true, decision });
  } catch (error: any) { return NextResponse.json({ error: error.message || "AI approval failed" }, { status: 500 }); }
}
