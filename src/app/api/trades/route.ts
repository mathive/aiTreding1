import { NextResponse } from "next/server";
import { db } from "@/db";
import { trades, users, notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";
import { INITIAL_ASSETS } from "@/lib/market-data";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // OPEN, CLOSED, or undefined (ALL)
    const market = searchParams.get("market");
    const search = searchParams.get("search");

    let allTrades = await db
      .select()
      .from(trades)
      .where(eq(trades.userId, currentUser.id))
      .orderBy(desc(trades.entryTime));

    if (status && status !== "ALL") {
      allTrades = allTrades.filter((t) => t.status === status);
    }
    if (market && market !== "all") {
      allTrades = allTrades.filter((t) => t.market === market);
    }
    if (search) {
      const q = search.toLowerCase();
      allTrades = allTrades.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.strategyUsed.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q)
      );
    }

    // Compute stats
    const openTrades = allTrades.filter((t) => t.status === "OPEN");
    const closedTrades = allTrades.filter((t) => t.status === "CLOSED");

    const totalOpenPnl = openTrades.reduce((acc, t) => acc + Number(t.pnl || 0), 0);
    const totalClosedPnl = closedTrades.reduce((acc, t) => acc + Number(t.pnl || 0), 0);
    const winningTrades = closedTrades.filter((t) => Number(t.pnl || 0) > 0).length;
    const winRate =
      closedTrades.length > 0
        ? Number(((winningTrades / closedTrades.length) * 100).toFixed(1))
        : 0;

    return NextResponse.json({
      trades: allTrades,
      stats: {
        totalTrades: allTrades.length,
        openCount: openTrades.length,
        closedCount: closedTrades.length,
        totalOpenPnl: Number(totalOpenPnl.toFixed(2)),
        totalClosedPnl: Number(totalClosedPnl.toFixed(2)),
        winRate,
      },
    });
  } catch (error: any) {
    console.error("Error fetching trades:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch trades" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const {
      symbol,
      market = "crypto",
      type = "BUY", // BUY or SELL
      amount,
      leverage = 1,
      stopLoss,
      takeProfit,
      trailingStop = false,
      trailingDistance,
      strategyUsed = "Manual Trade (AI Guided)",
      aiConfidence = 85,
      aiReasoning = "Manual trade order placed with AI risk parameters.",
      executionType = "manual",
      entryPrice: customEntryPrice,
    } = body;

    if (!symbol || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Symbol and valid amount are required" }, { status: 400 });
    }

    const tradeAmount = Number(amount);
    const currentBal = Number(currentUser.balance);

    if (tradeAmount > currentBal) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${currentBal.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Get asset market price
    const asset = INITIAL_ASSETS.find((a) => a.symbol === symbol);
    const entryPrice = customEntryPrice ? Number(customEntryPrice) : asset ? asset.currentPrice : 100;
    const quantity = (tradeAmount * Number(leverage)) / entryPrice;

    const newTradeId = `trade_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const [newTrade] = await db
      .insert(trades)
      .values({
        id: newTradeId,
        userId: currentUser.id,
        symbol,
        market,
        type,
        status: "OPEN",
        entryPrice: String(entryPrice),
        currentPrice: String(entryPrice),
        quantity: String(quantity.toFixed(6)),
        amount: String(tradeAmount.toFixed(2)),
        leverage: Number(leverage),
        stopLoss: stopLoss ? String(stopLoss) : null,
        takeProfit: takeProfit ? String(takeProfit) : null,
        trailingStop: Boolean(trailingStop),
        trailingDistance: trailingDistance ? String(trailingDistance) : null,
        pnl: "0.00",
        pnlPercent: "0.00",
        strategyUsed,
        aiConfidence: Number(aiConfidence),
        aiReasoning,
        executionType,
        entryTime: new Date(),
      })
      .returning();

    // Deduct margin from balance
    const updatedBal = currentBal - tradeAmount;
    await db
      .update(users)
      .set({ balance: String(updatedBal.toFixed(2)), updatedAt: new Date() })
      .where(eq(users.id, currentUser.id));

    // Create notification
    await db.insert(notifications).values({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      title: `⚡ Trade Executed: ${symbol} ${type}`,
      message: `Opened ${type} on ${symbol} at $${entryPrice}. Margin: $${tradeAmount.toFixed(2)} (${leverage}x leverage).`,
      type: "trade_executed",
      isRead: false,
      metadata: { tradeId: newTrade.id, symbol, amount: tradeAmount },
    });

    return NextResponse.json({
      success: true,
      trade: newTrade,
      message: `Trade opened on ${symbol} successfully`,
    });
  } catch (error: any) {
    console.error("Error executing trade:", error);
    return NextResponse.json({ error: error.message || "Failed to execute trade" }, { status: 500 });
  }
}
