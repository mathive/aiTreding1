"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const { activeTab, setActiveTab, toastMessage, isLoading, mt5Connected, setMt5Connected, refreshAllData, setUser, setTrades, setStrategies } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [isNewTraderModalOpen, setIsNewTraderModalOpen] = useState(false);

  const handleConnected = async (bootData: any) => {
    setSyncing(true); setMt5Connected(true); setActiveTab("overview");
    if (bootData?.user) setUser(bootData.user);
    if (bootData?.positions) {
      setTrades(bootData.positions.map((p: any) => ({
        id: "mt5_"+p.ticket, userId:"default", symbol:p.symbol, market:"forex",
        type:p.type||"BUY", status:"OPEN", entryPrice:String(p.openPrice||0),
        currentPrice:String(p.currentPrice||0), quantity:String(p.volume||0),
        amount:String((p.volume||0)*(p.openPrice||0)), leverage:0,
        stopLoss:p.sl?String(p.sl):null, takeProfit:p.tp?String(p.tp):null,
        trailingStop:false, pnl:String(p.profit||0),
        pnlPercent:p.currentPrice&&p.openPrice?String(((p.currentPrice-p.openPrice)/(p.openPrice)*100).toFixed(2)):"0",
        strategyUsed:"MT5 Position",aiConfidence:50,aiReasoning:"Live MT5 position",
        executionType:"mt5",entryTime:String(p.openTime||new Date().toISOString()),
      })));
    }
    setStrategies([
      {id:"s1",userId:"default",name:"Trend Following",description:"Follow market trends using EMA crossovers",category:"trend_follow",traderTypeMatch:"all",timeframes:["1h","4h"],indicators:{},targetAssets:["EUR/USD","GBP/USD","XAU/USD"],weight:40,minConfidence:70,stopLossPercent:"2.00",takeProfitPercent:"5.00",trailingStop:true,isActive:true,winRate:"65",totalTradesCount:0,profitFactor:"0"},
      {id:"s2",userId:"default",name:"Breakout Scalper",description:"Breakout on 5m/15m charts",category:"breakout",traderTypeMatch:"scalper",timeframes:["5m","15m"],indicators:{},targetAssets:["EUR/USD","GBP/USD"],weight:30,minConfidence:75,stopLossPercent:"1.50",takeProfitPercent:"3.00",trailingStop:true,isActive:true,winRate:"62",totalTradesCount:0,profitFactor:"0"},
      {id:"s3",userId:"default",name:"Mean Reversion",description:"Buy dips sell rips",category:"mean_reversion",traderTypeMatch:"swing_trader",timeframes:["15m","1h"],indicators:{},targetAssets:["XAU/USD","EUR/USD"],weight:30,minConfidence:72,stopLossPercent:"1.80",takeProfitPercent:"4.00",trailingStop:false,isActive:false,winRate:"58",totalTradesCount:0,profitFactor:"0"},
    ]);
    await refreshAllData?.();
    setTimeout(async () => { await refreshAllData?.(); setSyncing(false); }, 1500);
  };

  if (!mt5Connected) return <ConnectionGate onConnected={handleConnected} />;
  if (syncing) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4"><div className="w-10 h-10 rounded-full border-3 border-red-500 border-t-transparent animate-spin"/><p className="text-sm text-slate-400 font-mono">Pulling your Vantage account data...</p></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Navbar onOpenNewTraderModal={()=>setIsNewTraderModalOpen(true)}/>
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar/>
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950 min-h-[calc(100vh-4rem)]">
          {isLoading ? <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400"><div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"/><p className="text-xs font-mono">Loading...</p></div> : <>
            {activeTab==="overview"&&<DashboardOverview/>}
            {activeTab==="liveaccount"&&<LiveAccountView/>}
            {activeTab==="terminal"&&<TerminalChartView/>}
            {activeTab==="positions"&&<PositionsView/>}
            {activeTab==="scanner"&&<MarketScannerView/>}
            {activeTab==="strategies"&&<StrategyHubView/>}
            {activeTab==="bot"&&<AutonomousBotView/>}
            {activeTab==="backtest"&&<BacktestingView/>}
            {activeTab==="copilot"&&<CopilotView/>}
            {activeTab==="pricescan"&&<PriceScanView/>}
            {activeTab==="settings"&&<SettingsView/>}
          </>}
        </main>
      </div>
      <TradeOrderModal/> <EditPositionModal/> <CreateStrategyModal/> <DepositResetModal/>
      <NewTraderModal isOpen={isNewTraderModalOpen} onClose={()=>setIsNewTraderModalOpen(false)}/>
      <Toast message={toastMessage}/>
    </div>
  );
}

export default function Page() { return <AppProvider><MainContent/></AppProvider>; }
