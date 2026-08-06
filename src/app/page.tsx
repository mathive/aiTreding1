"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { BacktestingView } from "@/components/views/BacktestingView";
import { CopilotView } from "@/components/views/CopilotView";
import { SettingsView } from "@/components/views/SettingsView";
import { LiveAccountView } from "@/components/views/LiveAccountView";
import { PriceScanView } from "@/components/views/PriceScanView";

import { TradeOrderModal } from "@/components/modals/TradeOrderModal";
import { EditPositionModal } from "@/components/modals/EditPositionModal";
import { CreateStrategyModal } from "@/components/modals/CreateStrategyModal";
import { DepositResetModal } from "@/components/modals/DepositResetModal";
import { NewTraderModal } from "@/components/modals/NewTraderModal";

function MainContent() {
  const { activeTab, setActiveTab, toastMessage, isLoading, mt5Connected, setMt5Connected, refreshAllData } = useApp();
  const [isNewTraderModalOpen, setIsNewTraderModalOpen] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const didBootstrap = useRef(false);

  const handleConnected = () => {
    setMt5Connected(true);
    setActiveTab("overview");
  };

  useEffect(() => {
    if (mt5Connected && !didBootstrap.current) {
      didBootstrap.current = true;
      (async () => {
        await refreshAllData?.();
        setTimeout(async () => {
          await refreshAllData?.();
          setBootstrapping(false);
        }, 1500);
      })();
    }
  }, [mt5Connected, refreshAllData]);

  if (!mt5Connected) {
    return <ConnectionGate onConnected={handleConnected} />;
  }

  if (bootstrapping || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-3 border-red-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Syncing your Vantage account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <Navbar onOpenNewTraderModal={() => setIsNewTraderModalOpen(true)} />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950 min-h-[calc(100vh-4rem)]">
          {activeTab === "overview" && <DashboardOverview />}
          {activeTab === "bot" && <AutonomousBotView />}
          {activeTab === "scanner" && <MarketScannerView />}
          {activeTab === "terminal" && <TerminalChartView />}
          {activeTab === "strategies" && <StrategyHubView />}
          {activeTab === "positions" && <PositionsView />}
          {activeTab === "backtest" && <BacktestingView />}
          {activeTab === "copilot" && <CopilotView />}
          {activeTab === "liveaccount" && <LiveAccountView />}
          {activeTab === "pricescan" && <PriceScanView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>
      <TradeOrderModal />
      <EditPositionModal />
      <CreateStrategyModal />
      <DepositResetModal />
      <NewTraderModal isOpen={isNewTraderModalOpen} onClose={() => setIsNewTraderModalOpen(false)} />
      <Toast message={toastMessage} />
    </div>
  );
}

export default function Page() {
  return <AppProvider><MainContent /></AppProvider>;
}
