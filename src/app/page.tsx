"use client";

import React, { useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";
import { ConnectionGate } from "@/components/ConnectionGate";

import { DashboardOverview } from "@/components/views/DashboardOverview";
import { AutonomousBotView } from "@/components/views/AutonomousBotView";
import { MarketScannerView } from "@/components/views/MarketScannerView";
import { TerminalChartView } from "@/components/views/TerminalChartView";
import { StrategyHubView } from "@/components/views/StrategyHubView";
import { PositionsView } from "@/components/views/PositionsView";
import { LiveAccountView } from "@/components/views/LiveAccountView";

import { TradeOrderModal } from "@/components/modals/TradeOrderModal";
import { EditPositionModal } from "@/components/modals/EditPositionModal";
import { CreateStrategyModal } from "@/components/modals/CreateStrategyModal";
import { DepositResetModal } from "@/components/modals/DepositResetModal";

function MainContent() {
  const { activeTab, setActiveTab, toastMessage, isLoading, mt5Connected, setMt5Connected, refreshAllData, setUser, setTrades, setStrategies, setMarketAssets, setBotConfig } = useApp();
  const [syncing, setSyncing] = useState(false);

  const handleConnected = async (bootData: any) => {
    setSyncing(true);
    setMt5Connected(true);
    setActiveTab("overview");

    // Set user with MT5 balance
    if (bootData?.user) {
      setUser({ ...bootData.user, autoTradingEnabled: true, soundEffects: true, apiKeySimulation: false, tradingMode: "live" });
    }

    // Set active bot config
    setBotConfig({ id: "bot_active", userId: "default", name: "MT5 Auto Trader", isActive: true, selectedStrategyIds: [{ strategyId: "s1", weight: 60 }, { strategyId: "s2", weight: 40 }], confluenceThreshold: 50, tradeAllocationType: "percent", tradeAllocationValue: "5.00", maxOpenTrades: 4, allowedMarkets: ["forex"], executionMode: "autonomous", defaultLeverage: 100, totalBotTrades: 0, botPnl: "0.00" });

    // Set strategies
    setStrategies([
      { id: "s1", userId: "default", name: "Trend Following", description: "EMA crossover trend continuation on 1H/4H", category: "trend_follow", traderTypeMatch: "all", timeframes: ["1h", "4h"], indicators: {}, targetAssets: ["EUR/USD", "GBP/USD", "XAU/USD"], weight: 60, minConfidence: 70, stopLossPercent: "2.00", takeProfitPercent: "5.00", trailingStop: true, isActive: true, winRate: "0", totalTradesCount: 0, profitFactor: "0" },
      { id: "s2", userId: "default", name: "Breakout Scalper", description: "5M/15M breakout with volume confirmation", category: "breakout", traderTypeMatch: "scalper", timeframes: ["5m", "15m"], indicators: {}, targetAssets: ["EUR/USD", "GBP/USD"], weight: 40, minConfidence: 75, stopLossPercent: "1.50", takeProfitPercent: "3.00", trailingStop: true, isActive: true, winRate: "0", totalTradesCount: 0, profitFactor: "0" },
      { id: "s3", userId: "default", name: "Mean Reversion", description: "Oversold bounce / overbought fade on 15M/1H", category: "mean_reversion", traderTypeMatch: "swing_trader", timeframes: ["15m", "1h"], indicators: {}, targetAssets: ["XAU/USD", "EUR/USD"], weight: 30, minConfidence: 72, stopLossPercent: "1.80", takeProfitPercent: "4.00", trailingStop: false, isActive: false, winRate: "0", totalTradesCount: 0, profitFactor: "0" },
    ]);

    // Set positions from MT5
    if (bootData?.positions?.length) {
      setTrades(bootData.positions.map((p: any) => ({
        id: "mt5_" + p.ticket, userId: "default", symbol: p.symbol, market: "forex",
        type: p.type || "BUY", status: "OPEN", entryPrice: String(p.openPrice || 0),
        currentPrice: String(p.currentPrice || 0), quantity: String(p.volume || 0),
        amount: String((p.volume || 0) * (p.openPrice || 0)), leverage: 100,
        stopLoss: p.sl ? String(p.sl) : null, takeProfit: p.tp ? String(p.tp) : null,
        trailingStop: false, pnl: String(p.profit || 0),
        pnlPercent: p.currentPrice && p.openPrice ? String(((p.currentPrice - p.openPrice) / p.openPrice * 10000).toFixed(2)) : "0",
        strategyUsed: "MT5 Position", aiConfidence: 50, aiReasoning: "Live Vantage position",
        executionType: "mt5", entryTime: String(p.openTime || new Date().toISOString()),
      })));
    }

    // Load market data and refresh
    await refreshAllData?.();
    setTimeout(async () => { await refreshAllData?.(); setSyncing(false); }, 2000);
  };

  if (!mt5Connected) return <ConnectionGate onConnected={handleConnected} />;

  if (syncing) {
    return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
      <p className="text-base text-slate-300 font-semibold">Syncing your Vantage account...</p>
      <p className="text-xs text-slate-500">Pulling balance, positions, and market data</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Navbar onOpenNewTraderModal={() => {}} />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950 min-h-[calc(100vh-4rem)]">
          {isLoading ? <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" /></div> : <>
            {activeTab === "overview" && <DashboardOverview />}
            {activeTab === "liveaccount" && <LiveAccountView />}
            {activeTab === "terminal" && <TerminalChartView />}
            {activeTab === "positions" && <PositionsView />}
            {activeTab === "scanner" && <MarketScannerView />}
            {activeTab === "strategies" && <StrategyHubView />}
            {activeTab === "bot" && <AutonomousBotView />}
          </>}
        </main>
      </div>
      <TradeOrderModal /> <EditPositionModal /> <CreateStrategyModal /> <DepositResetModal />
      <Toast message={toastMessage} />
    </div>
  );
}

export default function Page() { return <AppProvider><MainContent /></AppProvider>; }
