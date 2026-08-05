"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  FlaskConical,
  Play,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const BacktestingView: React.FC = () => {
  const { strategies, marketAssets, updateBotConfig, showToast, setActiveTab } = useApp();

  const [symbol, setSymbol] = useState<string>("BTC/USDT");
  const [timeframe, setTimeframe] = useState<string>("1h");
  const [dateRange, setDateRange] = useState<string>("90d");
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([
    "strat_breakout_momentum",
    "strat_neural_trend_pulse",
  ]);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [savedBacktests, setSavedBacktests] = useState<any[]>([]);

  const fetchBacktests = async () => {
    try {
      const res = await fetch("/api/backtest");
      if (res.ok) {
        const data = await res.json();
        setSavedBacktests(data.backtests || []);
        if (data.backtests && data.backtests.length > 0 && !currentResult) {
          setCurrentResult(data.backtests[0]);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchBacktests();
  }, []);

  const handleRunBacktest = async () => {
    if (selectedStrategyIds.length === 0) {
      showToast("Please select at least one strategy to backtest", "error");
      return;
    }

    setIsRunning(true);
    try {
      const res = await fetch("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          timeframe,
          dateRange,
          initialCapital,
          strategyIds: selectedStrategyIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentResult(data.backtest);
        showToast(data.message, "success");
        fetchBacktests();
      } else {
        showToast(data.error || "Backtest failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Simulation error", "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeployToBot = async () => {
    if (!currentResult) return;
    const stratWeights = (currentResult.strategyIds || []).map((id: string) => ({
      strategyId: id,
      weight: Math.round(100 / currentResult.strategyIds.length),
    }));

    await updateBotConfig({
      selectedStrategyIds: stratWeights,
      confluenceThreshold: 75,
    });

    showToast("Strategy combination deployed to Autonomous Bot!", "success");
    setActiveTab("bot");
  };

  const toggleStrat = (id: string) => {
    setSelectedStrategyIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Multi-Strategy Backtesting Lab</h1>
              <p className="text-xs text-slate-400">Simulate strategy combinations against historical market data</p>
            </div>
          </div>
        </div>

        {currentResult && (
          <button
            onClick={handleDeployToBot}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            Deploy Blend to Autonomous Bot
          </button>
        )}
      </div>

      {/* Parameter Selection Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Simulation Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Asset */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Target Asset
            </label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {marketAssets.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol} ({a.market.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Execution Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="15m">15 Minutes (Fast Intraday)</option>
              <option value="1h">1 Hour (Standard Trend)</option>
              <option value="4h">4 Hours (Swing Momentum)</option>
              <option value="1D">1 Day (Macro Trend)</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Historical Horizon
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="180d">Last 180 Days</option>
              <option value="1y">Last 1 Year</option>
            </select>
          </div>

          {/* Capital */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Starting Capital ($)
            </label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Math.max(1000, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Strategy Checkbox Blend */}
        <div>
          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-2">
            Select Strategies in Confluence Blend:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {strategies.map((strat) => {
              const selected = selectedStrategyIds.includes(strat.id);
              return (
                <button
                  type="button"
                  key={strat.id}
                  onClick={() => toggleStrat(strat.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    selected
                      ? "bg-cyan-950/70 border-cyan-700 text-cyan-200"
                      : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{strat.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{strat.category}</p>
                  </div>
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ml-2 ${selected ? "bg-cyan-500 text-slate-950 font-bold" : "border border-slate-700"}`}>
                    {selected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleRunBacktest}
          disabled={isRunning}
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-cyan-950/80 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          {isRunning ? "Simulating Historical Multi-Strategy Trades..." : "Run Multi-Strategy Simulation"}
        </button>
      </div>

      {/* Results Section */}
      {currentResult && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Return</span>
              <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">
                +{currentResult.totalReturnPercent}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Win Rate</span>
              <span className="text-xl font-mono font-bold text-cyan-400 mt-1 block">
                {currentResult.winRate}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Profit Factor</span>
              <span className="text-xl font-mono font-bold text-indigo-300 mt-1 block">
                {currentResult.profitFactor}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Max Drawdown</span>
              <span className="text-xl font-mono font-bold text-rose-400 mt-1 block">
                -{currentResult.maxDrawdown}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Sharpe Ratio</span>
              <span className="text-xl font-mono font-bold text-purple-300 mt-1 block">
                {currentResult.sharpeRatio}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Trades Total</span>
              <span className="text-xl font-mono font-bold text-white mt-1 block">
                {currentResult.totalTrades} ({currentResult.winningTrades}W / {currentResult.losingTrades}L)
              </span>
            </div>
          </div>

          {/* Equity Growth Curve Chart */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Simulated Equity Growth Curve vs Buy & Hold Benchmark
              </h3>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                End Capital: ${parseFloat(currentResult.finalCapital).toLocaleString()}
              </span>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentResult.equityCurve} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "12px", fontSize: "11px" }} />
                  <Legend />
                  <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#equityGrad)" name="Nexus AI Multi-Strategy" />
                  <Area type="monotone" dataKey="benchmark" stroke="#64748b" strokeDasharray="3 3" strokeWidth={1.5} fill="none" name="Buy & Hold Benchmark" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade by Trade Log */}
          {currentResult.tradeLogs && (
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Backtested Trade Executions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800 bg-slate-950/40">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Entry Price</th>
                      <th className="py-2 px-3">Exit Price</th>
                      <th className="py-2 px-3">PnL ($ / %)</th>
                      <th className="py-2 px-3">Execution Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {currentResult.tradeLogs.map((log: any) => {
                      const isWin = log.pnl >= 0;
                      return (
                        <tr key={log.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400">{log.entryDate} → {log.exitDate}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-400">{log.type}</td>
                          <td className="py-2.5 px-3 text-slate-200">${log.entryPrice.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-cyan-300">${log.exitPrice.toLocaleString()}</td>
                          <td className={`py-2.5 px-3 font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                            {isWin ? "+" : ""}${log.pnl} ({formatPercent(log.pnlPercent)})
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-400">{log.reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
