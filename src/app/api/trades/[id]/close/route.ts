import { NextResponse } from "next/server";
import { db } from "@/db";
import { trades, users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";
import { getLiveTickers } from "@/lib/market-data-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const body = await request.json().catch(() => ({}));
    const closePercent = body.closePercent || 100;
    const customExitPrice = body.exitPrice;
    const [trade] = await db.select().from(trades).where(eq(trades.id, id)).limit(1);
    if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    if (trade.status !== "OPEN") return NextResponse.json({ error: "Trade is not open" }, { status: 400 });
    let exitPrice = customExitPrice ? Number(customExitPrice) : Number(trade.currentPrice);
    try { const liveTickers = await getLiveTickers(); const asset = liveTickers.find((a) => a.symbol === trade.symbol); if (asset && !customExitPrice) exitPrice = asset.currentPrice; } catch {}
    const entryPrice = Number(trade.entryPrice);
    const originalAmount = Number(trade.amount);
    const leverage = trade.leverage || 1;
    let pnlPercent = 0;
    if (trade.type === "BUY") pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100 * leverage;
    else pnlPercent = ((entryPrice - exitPrice) / entryPrice) * 100 * leverage;
    const portion = Math.min(100, Math.max(1, closePercent)) / 100;
    const closedAmount = originalAmount * portion;
    const realizedPnl = (closedAmount * pnlPercent) / 100;
    let updatedTrade;
    if (portion >= 0.99) {
      const [res] = await db.update(trades).set({ status: "CLOSED", exitPrice: String(exitPrice.toFixed(4)), currentPrice: String(exitPrice.toFixed(4)), pnl: String(realizedPnl.toFixed(2)), pnlPercent: String(pnlPercent.toFixed(2)), exitTime: new Date().toISOString(), closeReason: body.closeReason || "manual_close", updatedAt: new Date().toISOString() }).where(eq(trades.id, trade.id)).returning();
      updatedTrade = res;
    } else {
      const remainingAmount = originalAmount - closedAmount;
      const remainingQuantity = Number(trade.quantity) * (1 - portion);
      const [res] = await db.update(trades).set({ amount: String(remainingAmount.toFixed(2)), quantity: String(remainingQuantity.toFixed(6)), currentPrice: String(exitPrice.toFixed(4)), notes: `${trade.notes ? trade.notes + " | " : ""}Partially closed ${closePercent}% at $${exitPrice.toFixed(2)} (PnL: ${realizedPnl >= 0 ? "+" : ""}$${realizedPnl.toFixed(2)})`, updatedAt: new Date().toISOString() }).where(eq(trades.id, trade.id)).returning();
      updatedTrade = res;
    }
    const currentBalance = Number(currentUser.balance);
    const newBalance = currentBalance + closedAmount + realizedPnl;
    await db.update(users).set({ balance: String(newBalance.toFixed(2)), updatedAt: new Date().toISOString() }).where(eq(users.id, currentUser.id));
    await db.insert(notifications).values({ id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, userId: currentUser.id, title: `${realizedPnl >= 0 ? "🎉 Position Closed in Profit" : "📉 Position Closed"}`, message: `Closed ${portion >= 0.99 ? "100%" : `${closePercent}%`} of ${trade.symbol} (${trade.type}) at $${exitPrice.toFixed(2)}. Net PnL: ${realizedPnl >= 0 ? "+" : ""}$${realizedPnl.toFixed(2)} (${pnlPercent.toFixed(2)}%).`, type: realizedPnl >= 0 ? "tp_hit" : "sl_hit", isRead: false, metadata: { tradeId: trade.id, symbol: trade.symbol, pnl: realizedPnl, pnlPercent } });
    return NextResponse.json({ success: true, trade: updatedTrade, realizedPnl: Number(realizedPnl.toFixed(2)), pnlPercent: Number(pnlPercent.toFixed(2)), newBalance: Number(newBalance.toFixed(2)), message: `Closed ${trade.symbol} position. Net PnL: ${realizedPnl >= 0 ? "+" : ""}$${realizedPnl.toFixed(2)}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to close trade" }, { status: 500 });
  }
}
