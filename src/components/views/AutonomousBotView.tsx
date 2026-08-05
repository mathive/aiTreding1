"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  Bot,
  Sliders,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Cpu,
} from "lucide-react";

export const AutonomousBotView: React.FC = () => {
  const {
    botConfig,
    updateBotConfig,
    strategies,
    toggleStrategyActive,
    user,
    updateUserSettings,
    runScanAndTrade,
    isScanning,
    marketAssets,
    openTrades,
    closedTrades,
    setOrderModalSymbol,
  } = useApp();

  const [confluenceThreshold, setConfluenceThreshold] = useState<number>(
    botConfig?.confluenceThreshold || 75
  );
  const [allocationType, setAllocationType] = useState<string>(
    botConfig?.tradeAllocationType || "percent"
  );
  const [allocationValue, setAllocationValue] = useState<string>(
    botConfig?.tradeAllocationValue || "5.00"
  );
  const [maxOpenTrades, setMaxOpenTrades] = useState<number>(
    botConfig?.maxOpenTrades || 4
  );
  const [defaultLeverage, setDefaultLeverage] = useState<number>(
    botConfig?.defaultLeverage || 5
  );

  const [saving, setSaving] = useState<boolean>(false);

  const handleSaveConfig = async () => {
    setSaving(true);
    await updateBotConfig({
      confluenceThreshold,
      tradeAllocationType: allocationType,
      tradeAllocationValue: allocationValue,
      maxOpenTrades,
      defaultLeverage,
    });
    setSaving(false);
  };

  const handleToggleBot = async () => {
    if (!botConfig) return;
    const nextState = !botConfig.isActive;
    await updateBotConfig({ isActive: nextState });
    if (user) {
      await updateUserSettings({ autoTradingEnabled: nextState });
    }
  };

  const botTrades = [...openTrades, ...closedTrades].filter((t) => t.executionType === "ai_autonomous");

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Autonomous AI Trade Execution Engine</h1>
              <p className="text-xs text-slate-400 font-mono">SELECT STRATEGIES • SET CONFLUENCE WEIGHTS • AI TAKES THE TRADES</p>
            </div>
          </div>
          <p className="text-xs lg:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Choose any combination of trending strategies below. Nexus AI continuously runs high-frequency scans across 
            Crypto, Equities, & Forex. When the weighted confluence score reaches your threshold, the AI automatically executes high-probability trades.
          </p>
        </div>

        {/* Master Bot Toggle & Force Scan */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleToggleBot}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xl ${
              botConfig?.isActive && user?.autoTradingEnabled
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/80"
                : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/80"
            }`}
          >
            {botConfig?.isActive && user?.autoTradingEnabled ? (
              <>
                <Pause className="w-4 h-4" />
                Auto-Trade: ACTIVE
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Auto-Trade: PAUSED
              </>
            )}
          </button>

          <button
            onClick={() => runScanAndTrade(true)}
            disabled={isScanning}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-cyan-950/80 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isScanning ? "animate-spin text-cyan-200" : "text-yellow-300"}`} />
            {isScanning ? "Evaluating Markets..." : "Trigger AI Scan Now"}
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Multi-Strategy Selector, Right = Execution Parameters & Confluence Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Choose Multiple Trending Strategies */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Select Multi-Strategy Portfolio
              </h2>
              <p className="text-xs text-slate-400">
                Toggle strategies ON/OFF. Nexus AI evaluates market setups by combining weighted votes from active strategies.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300">
              {strategies.filter((s) => s.isActive).length} Active in Blend
            </span>
          </div>

          <div className="space-y-3">
            {strategies.map((strategy) => {
              const isActive = strategy.isActive;
              return (
                <div
                  key={strategy.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isActive
                      ? "bg-slate-900/90 border-cyan-800/80 shadow-lg shadow-cyan-950/20"
                      : "bg-slate-950/60 border-slate-800/70 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`strat_${strategy.id}`}
                        checked={isActive}
                        onChange={(e) => toggleStrategyActive(strategy.id, e.target.checked)}
                        className="mt-1 w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`strat_${strategy.id}`}
                            className="font-bold text-sm text-white cursor-pointer hover:text-cyan-300"
                          >
                            {strategy.name}
                          </label>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {strategy.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{strategy.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-lg border border-cyan-900">
                        {strategy.weight}% Weight
                      </span>
                    </div>
                  </div>

                  {/* Strategy Metrics & Rules */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950/70 p-2.5 rounded-xl border border-slate-850">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Win Rate</span>
                      <span className="text-emerald-400 font-semibold">{strategy.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Profit Factor</span>
                      <span className="text-indigo-300 font-semibold">{strategy.profitFactor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Stop Loss</span>
                      <span className="text-rose-400 font-semibold">{strategy.stopLossPercent}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Take Profit</span>
                      <span className="text-emerald-400 font-semibold">{strategy.takeProfitPercent}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Bot Execution Guardrails & Live Confluence Scanner */}
        <div className="space-y-6">
          {/* Risk & Execution Configuration Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Autonomous Bot Parameters
              </h3>
            </div>

            {/* Confluence Threshold Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Confluence Execution Threshold
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {confluenceThreshold}% Score
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={confluenceThreshold}
                onChange={(e) => setConfluenceThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                AI will only enter a trade when combined strategy confidence is ≥ {confluenceThreshold}%.
              </p>
            </div>

            {/* Allocation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                  Position Allocation
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="25"
                    step="1"
                    value={allocationValue}
                    onChange={(e) => setAllocationValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs font-mono">% Bal</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                  Max Open Trades
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxOpenTrades}
                  onChange={(e) => setMaxOpenTrades(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Default Leverage */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Default AI Leverage: <span className="text-cyan-400 font-mono font-bold">{defaultLeverage}x</span>
                </label>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={defaultLeverage}
                onChange={(e) => setDefaultLeverage(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-cyan-950/60 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving Parameters..." : "Save Bot Configuration"}
            </button>
          </div>

          {/* Live Confluence Matrix */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Confluence Matrix</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Real-time</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              {marketAssets.slice(0, 6).map((asset) => {
                const aboveThreshold = asset.aiConfidence >= confluenceThreshold;
                return (
                  <div key={asset.symbol} className="pt-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{asset.symbol}</span>
                        {aboveThreshold && (
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            TRIGGER READY
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">{asset.category}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <span className={`font-bold ${aboveThreshold ? "text-cyan-400" : "text-slate-400"}`}>
                          {asset.aiConfidence}%
                        </span>
                        <span className="text-[10px] text-slate-500 block">{asset.trendStatus}</span>
                      </div>
                      <button
                        onClick={() => setOrderModalSymbol(asset.symbol)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 cursor-pointer"
                      >
                        Trade
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous Bot Execution Log Table */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Autonomous AI Execution Log ({botTrades.length})</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total Bot PnL: <strong className="text-emerald-400">+$8,240.50</strong></span>
        </div>

        {botTrades.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No autonomous trades recorded yet. Once the bot runs a scan, trades will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800 bg-slate-950/40">
                <tr>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Entry Price</th>
                  <th className="py-2.5 px-3">Current / Exit</th>
                  <th className="py-2.5 px-3">Confluence</th>
                  <th className="py-2.5 px-3">PnL ($ / %)</th>
                  <th className="py-2.5 px-3">Strategy Used</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {botTrades.map((t) => {
                  const pnlNum = parseFloat(t.pnl || "0");
                  const isPositive = pnlNum >= 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-sans font-bold text-white">{t.symbol}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.type === "BUY" ? "text-emerald-400 bg-emerald-950" : "text-rose-400 bg-rose-950"}`}>
                          {t.type} {t.leverage}x
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">${parseFloat(t.entryPrice).toLocaleString()}</td>
                      <td className="py-3 px-3 text-cyan-300">${t.exitPrice ? parseFloat(t.exitPrice).toLocaleString() : parseFloat(t.currentPrice).toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold text-cyan-400">{t.aiConfidence}%</td>
                      <td className={`py-3 px-3 font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {isPositive ? "+" : ""}${pnlNum.toFixed(2)} ({formatPercent(t.pnlPercent)})
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-400 truncate max-w-xs">{t.strategyUsed}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "OPEN" ? "bg-cyan-950 text-cyan-300 border border-cyan-800" : "bg-slate-800 text-slate-400"}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
