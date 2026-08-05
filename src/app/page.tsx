"use client";

import React, { useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";

// Views
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

// Modals
import { TradeOrderModal } from "@/components/modals/TradeOrderModal";
import { EditPositionModal } from "@/components/modals/EditPositionModal";
import { CreateStrategyModal } from "@/components/modals/CreateStrategyModal";
import { DepositResetModal } from "@/components/modals/DepositResetModal";
import { NewTraderModal } from "@/components/modals/NewTraderModal";

function MainContent() {
  const { activeTab, toastMessage, isLoading } = useApp();
  const [isNewTraderModalOpen, setIsNewTraderModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <Navbar onOpenNewTraderModal={() => setIsNewTraderModalOpen(true)} />

      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950 min-h-[calc(100vh-4rem)]">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <p className="text-xs font-mono">Initializing Nexus AI Trading Engine...</p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <TradeOrderModal />
      <EditPositionModal />
      <CreateStrategyModal />
      <DepositResetModal />
      <NewTraderModal
        isOpen={isNewTraderModalOpen}
        onClose={() => setIsNewTraderModalOpen(false)}
      />

      {/* Floating Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
