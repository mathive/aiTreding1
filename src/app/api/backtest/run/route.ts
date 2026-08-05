import { NextResponse } from "next/server";
import { db } from "@/db";
import { backtests, strategies } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helper";
import { INITIAL_ASSETS } from "@/lib/market-data";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const {
      symbol = "BTC/USDT",
      timeframe = "1h",
      dateRange = "90d",
      strategyIds = [],
      initialCapital = 10000,
      name,
    } = body;

    const allStrategies = await db.select().from(strategies);
    const selectedStrategies = allStrategies.filter((s) => strategyIds.includes(s.id));
    const stratNames = selectedStrategies.map((s) => s.name).join(" + ") || "Multi-Strategy AI";

    const asset = INITIAL_ASSETS.find((a) => a.symbol === symbol) || INITIAL_ASSETS[0];

    // Determine simulation steps
    let steps = 90;
    if (dateRange === "30d") steps = 30;
    if (dateRange === "180d") steps = 180;
    if (dateRange === "1y") steps = 365;

    // Simulate multi-strategy trades
    const numTrades = Math.floor(steps * 0.3 + Math.random() * 5);
    const baseWinRate = selectedStrategies.length > 0
      ? selectedStrategies.reduce((acc, s) => acc + Number(s.winRate || 68), 0) / selectedStrategies.length
      : 70;

    let capital = Number(initialCapital);
    const startCapital = capital;
    let benchmarkCapital = capital;
    const equityCurve: Array<{ date: string; equity: number; benchmark: number }> = [];
    const tradeLogs: Array<{
      id: string;
      type: string;
      entryDate: string;
      exitDate: string;
      entryPrice: number;
      exitPrice: number;
      pnl: number;
      pnlPercent: number;
      reason: string;
    }> = [];

    let winningTrades = 0;
    let losingTrades = 0;
    let maxDrawdown = 0;
    let peakCapital = capital;

    const basePrice = asset.currentPrice * 0.85;
    let currentSimPrice = basePrice;

    // Sample dates
    const now = Date.now();
    const stepMs = (steps * 24 * 3600 * 1000) / steps;

    for (let day = 0; day <= steps; day += Math.max(1, Math.floor(steps / 8))) {
      const dateStr = `Day ${day === 0 ? 1 : day}`;
      equityCurve.push({
        date: dateStr,
        equity: Math.round(capital),
        benchmark: Math.round(benchmarkCapital),
      });

      // Benchmark slight upward drift
      benchmarkCapital *= 1 + (Math.sin(day * 0.1) * 0.02 + 0.005);
    }

    for (let t = 0; t < numTrades; t++) {
      const isWin = Math.random() * 100 < baseWinRate;
      const tradeAlloc = capital * 0.2; // 20% position size
      const pnlPct = isWin
        ? 3.5 + Math.random() * 6.5 // +3.5% to +10%
        : -(1.5 + Math.random() * 2.5); // -1.5% to -4%

      const tradePnl = (tradeAlloc * pnlPct) / 100;
      capital += tradePnl;

      if (isWin) winningTrades++;
      else losingTrades++;

      if (capital > peakCapital) peakCapital = capital;
      const dd = ((peakCapital - capital) / peakCapital) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;

      const entryPrice = Math.round(currentSimPrice * (1 + (Math.random() - 0.5) * 0.04));
      const exitPrice = Math.round(entryPrice * (1 + pnlPct / 100));
      currentSimPrice = exitPrice;

      const tradeDate = new Date(now - (numTrades - t) * 3 * 24 * 3600 * 1000);
      const exitDate = new Date(tradeDate.getTime() + 1.5 * 24 * 3600 * 1000);

      tradeLogs.push({
        id: `bt_log_${t + 1}`,
        type: "BUY",
        entryDate: tradeDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        exitDate: exitDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        entryPrice,
        exitPrice,
        pnl: Number(tradePnl.toFixed(2)),
        pnlPercent: Number(pnlPct.toFixed(2)),
        reason: isWin
          ? `Confluence TP Hit (${selectedStrategies[0]?.name || "Breakout Engine"})`
          : `Risk Guard Stop-Loss Triggered`,
      });
    }

    // Ensure final point in equity curve matches
    if (equityCurve.length > 0) {
      equityCurve[equityCurve.length - 1].equity = Math.round(capital);
    }

    const totalReturnPercent = ((capital - startCapital) / startCapital) * 100;
    const finalWinRate = numTrades > 0 ? (winningTrades / numTrades) * 100 : 0;
    const totalGains = tradeLogs.filter((t) => t.pnl > 0).reduce((a, b) => a + b.pnl, 0);
    const totalLosses = Math.abs(tradeLogs.filter((t) => t.pnl < 0).reduce((a, b) => a + b.pnl, 0)) || 1;
    const profitFactor = Number((totalGains / totalLosses).toFixed(2));
    const sharpeRatio = Number((((totalReturnPercent / 100) - 0.04) / ((maxDrawdown || 5) / 100)).toFixed(2));

    const backtestName = name || `${symbol} ${stratNames.substring(0, 32)} (${dateRange.toUpperCase()})`;
    const newId = `bt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const [saved] = await db
      .insert(backtests)
      .values({
        id: newId,
        userId: currentUser.id,
        name: backtestName,
        symbol,
        timeframe,
        dateRange,
        strategyIds,
        initialCapital: String(startCapital.toFixed(2)),
        finalCapital: String(capital.toFixed(2)),
        totalReturnPercent: String(totalReturnPercent.toFixed(2)),
        winRate: String(finalWinRate.toFixed(2)),
        profitFactor: String(profitFactor.toFixed(2)),
        maxDrawdown: String(maxDrawdown.toFixed(2)),
        sharpeRatio: String(sharpeRatio.toFixed(2)),
        totalTrades: numTrades,
        winningTrades,
        losingTrades,
        equityCurve,
        tradeLogs,
      })
      .returning();

    return NextResponse.json({
      success: true,
      backtest: saved,
      message: `Backtest completed with +${totalReturnPercent.toFixed(1)}% total return and ${finalWinRate.toFixed(1)}% win rate!`,
    });
  } catch (error: any) {
    console.error("Error running backtest:", error);
    return NextResponse.json({ error: error.message || "Failed to run backtest" }, { status: 500 });
  }
}
