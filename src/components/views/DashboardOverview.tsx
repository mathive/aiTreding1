"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Bot,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Layers,
  Activity,
  CheckCircle2,
  DollarSign,
  PieChart,
  Clock,
  Play,
} from "lucide-react";

export const DashboardOverview: React.FC = () => {
  const {
    user,
    openTrades,
    closedTrades,
    strategies,
    botConfig,
    marketAssets,
    setActiveTab,
    setSelectedSymbol,
    setOrderModalSymbol,
    setEditTradeModalItem,
    closeTrade,
    runScanAndTrade,
    isScanning,
    setIsCreateStratModalOpen,
  } = useApp();

  const activeStrategies = strategies.filter((s) => s.isActive);
  const totalOpenPnl = openTrades.reduce((acc, t) => acc + parseFloat(t.pnl || "0"), 0);
  const totalClosedPnl = closedTrades.reduce((acc, t) => acc + parseFloat(t.pnl || "0"), 0);
  const netTotalPnl = totalOpenPnl + totalClosedPnl;

  const winningClosed = closedTrades.filter((t) => parseFloat(t.pnl || "0") > 0).length;
  const winRate =
    closedTrades.length > 0
      ? ((winningClosed / closedTrades.length) * 100).toFixed(1)
      : "72.4";

  // Top trending assets sorted by AI confidence
  const topTrending = [...marketAssets].sort((a, b) => b.aiConfidence - a.aiConfidence).slice(0, 4);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome & Bot Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Autonomous AI Trend Trading Engine Active
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || "Trader"}
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Nexus AI is monitoring <span className="text-cyan-400 font-semibold">{marketAssets.length} markets</span> across{" "}
              <span className="text-indigo-400 font-semibold">{activeStrategies.length} active trending strategies</span>.
              Confluence threshold set to <span className="text-white font-mono font-bold">{botConfig?.confluenceThreshold || 75}%</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => runScanAndTrade(true)}
              disabled={isScanning}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl shadow-cyan-950/80 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isScanning ? "animate-spin text-cyan-200" : "text-yellow-300"}`} />
              {isScanning ? "Evaluating Markets..." : "Force AI Scan & Execute"}
            </button>

            <button
              onClick={() => setActiveTab("bot")}
              className="flex items-center gap-2 px-4 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-2xl font-semibold text-xs transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              Configure Bot Blend
            </button>
          </div>
        </div>
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Portfolio</span>
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {formatCurrency(user?.balance)}
          </p>
          <div className="flex items-center gap-1.5 text-xs mt-2 text-slate-400">
            <span>Starting:</span>
            <span className="font-mono text-slate-300 font-semibold">{formatCurrency(user?.initialBalance)}</span>
          </div>
        </div>

        {/* Live Net PnL */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Realized & Open PnL</span>
            <div className={`p-2 rounded-xl ${netTotalPnl >= 0 ? "bg-emerald-950/80 text-emerald-400" : "bg-rose-950/80 text-rose-400"}`}>
              {netTotalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <p className={`text-2xl font-bold font-mono mt-2 ${netTotalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {netTotalPnl >= 0 ? "+" : ""}{formatCurrency(netTotalPnl)}
          </p>
          <div className="flex items-center gap-2 text-xs mt-2 font-mono text-slate-400">
            <span>Open: <strong className={totalOpenPnl >= 0 ? "text-emerald-400" : "text-rose-400"}>{totalOpenPnl >= 0 ? "+" : ""}${totalOpenPnl.toFixed(2)}</strong></span>
            <span>•</span>
            <span>Closed: <strong className={totalClosedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}>{totalClosedPnl >= 0 ? "+" : ""}${totalClosedPnl.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Strategy Win Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Win Rate (Forward)</span>
            <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {winRate}%
          </p>
          <div className="flex items-center gap-1.5 text-xs mt-2 text-slate-400">
            <span>{winningClosed} Wins</span>
            <span>/</span>
            <span>{closedTrades.length} Completed Trades</span>
          </div>
        </div>

        {/* Active Strategies Confluence */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Strategy Confluence Blend</span>
            <div className="p-2 rounded-xl bg-indigo-950/80 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-400 mt-2">
            {activeStrategies.length} Active
          </p>
          <div className="flex items-center gap-1.5 text-xs mt-2 text-slate-400">
            <span>Threshold:</span>
            <span className="font-mono text-cyan-300 font-bold">{botConfig?.confluenceThreshold || 75}% AI Min</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Positions & Top Trending Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Open Positions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-base font-bold text-white">Live Open Positions ({openTrades.length})</h2>
            </div>
            <button
              onClick={() => setActiveTab("positions")}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View Full Trade Logs <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {openTrades.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <Bot className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No active positions open</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Nexus AI will automatically enter trades when multi-strategy confluence exceeds {botConfig?.confluenceThreshold || 75}%.
              </p>
              <button
                onClick={() => runScanAndTrade(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Scan Markets Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {openTrades.map((trade) => {
                const pnlNum = parseFloat(trade.pnl || "0");
                const pnlPct = parseFloat(trade.pnlPercent || "0");
                const isPositive = pnlNum >= 0;

                return (
                  <div
                    key={trade.id}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => {
                            setSelectedSymbol(trade.symbol);
                            setActiveTab("terminal");
                          }}
                          className="font-bold text-base text-white hover:text-cyan-400 cursor-pointer flex items-center gap-1.5"
                        >
                          {trade.symbol}
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            trade.type === "BUY"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-rose-950 text-rose-400 border border-rose-800"
                          }`}
                        >
                          {trade.type} {trade.leverage}x
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase hidden sm:inline">
                          {trade.executionType.replace("_", " ")}
                        </span>
                      </div>

                      {/* Live PnL */}
                      <div className="text-right font-mono">
                        <div className={`text-base font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                          {isPositive ? "+" : ""}${pnlNum.toFixed(2)}
                        </div>
                        <div className={`text-[11px] font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                          {formatPercent(pnlPct)}
                        </div>
                      </div>
                    </div>

                    {/* Price & Strategy Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Entry Price</span>
                        <span className="text-slate-200 font-semibold">${parseFloat(trade.entryPrice).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Current Price</span>
                        <span className="text-cyan-300 font-semibold">${parseFloat(trade.currentPrice).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Stop Loss</span>
                        <span className="text-rose-400 font-semibold">{trade.stopLoss ? `$${parseFloat(trade.stopLoss).toLocaleString()}` : "Dynamic"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Take Profit</span>
                        <span className="text-emerald-400 font-semibold">{trade.takeProfit ? `$${parseFloat(trade.takeProfit).toLocaleString()}` : "Trailing"}</span>
                      </div>
                    </div>

                    {/* Strategy Reasoning & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-slate-400 truncate max-w-md">
                        <span className="text-slate-300 font-medium">{trade.strategyUsed}:</span> {trade.aiReasoning}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setEditTradeModalItem(trade)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 transition-colors cursor-pointer"
                        >
                          Edit SL/TP
                        </button>
                        <button
                          onClick={() => closeTrade(trade.id, 100, "manual_close")}
                          className="px-3 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/60 border border-rose-500/50 text-[11px] font-bold text-rose-200 transition-colors cursor-pointer"
                        >
                          Close Market
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Top Trending Confluence Scanner */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Top Trending Signals</h2>
            </div>
            <button
              onClick={() => setActiveTab("scanner")}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              All Markets <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topTrending.map((asset) => {
              const isPositive = asset.change24h >= 0;
              return (
                <div
                  key={asset.symbol}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-800/60 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{asset.symbol}</h4>
                        <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                          {asset.market}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{asset.name}</p>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-white">
                        ${asset.currentPrice < 10 ? asset.currentPrice.toFixed(4) : asset.currentPrice.toLocaleString()}
                      </div>
                      <div className={`text-[10px] font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatPercent(asset.change24h)}
                      </div>
                    </div>
                  </div>

                  {/* AI Gauge */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">AI Confluence:</span>
                      <span className="font-mono font-bold text-cyan-400">{asset.aiConfidence}% Conviction</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${asset.aiConfidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setOrderModalSymbol(asset.symbol)}
                      className="flex-1 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 rounded-xl text-[11px] font-bold text-emerald-200 transition-colors cursor-pointer text-center"
                    >
                      Take Trade
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSymbol(asset.symbol);
                        setActiveTab("terminal");
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] font-medium text-slate-300 transition-colors cursor-pointer"
                    >
                      Chart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Strategy Portfolio Weights */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Active Multi-Strategy Blend
            </h3>
            <p className="text-xs text-slate-400">
              Nexus AI blends signals from these strategies to calculate market confluence.
            </p>
          </div>
          <button
            onClick={() => setIsCreateStratModalOpen(true)}
            className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            + Create Strategy
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeStrategies.slice(0, 3).map((strat) => (
            <div
              key={strat.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white truncate">{strat.name}</h4>
                <span className="text-[10px] font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950">
                  {strat.weight}% Weight
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {strat.description}
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                <span>Win Rate: <strong className="text-emerald-400">{strat.winRate}%</strong></span>
                <span>Profit Factor: <strong className="text-indigo-300">{strat.profitFactor}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
