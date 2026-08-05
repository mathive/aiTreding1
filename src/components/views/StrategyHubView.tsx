"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Filter,
} from "lucide-react";

export const StrategyHubView: React.FC = () => {
  const {
    strategies,
    toggleStrategyActive,
    deleteStrategy,
    setIsCreateStratModalOpen,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredStrategies = strategies.filter((s) =>
    categoryFilter === "all" ? true : s.category === categoryFilter
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-950 border border-purple-800 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Trending Strategy Hub</h1>
              <p className="text-xs text-slate-400">Manage, backtest, and combine autonomous trading strategies</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateStratModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-950/60 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Strategy
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: "all", label: "All Strategies" },
          { id: "breakout", label: "Breakout Systems" },
          { id: "momentum", label: "Momentum Trend Surge" },
          { id: "smart_money", label: "Smart Money & Liquidity" },
          { id: "ml_ai", label: "Neural / AI Models" },
          { id: "mean_reversion", label: "Mean Reversion / Fib" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              categoryFilter === tab.id
                ? "bg-purple-950 border border-purple-700 text-purple-200 font-bold"
                : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStrategies.map((strategy) => {
          const isActive = strategy.isActive;
          return (
            <div
              key={strategy.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                isActive
                  ? "bg-slate-900/90 border-purple-800/80 shadow-xl shadow-purple-950/20"
                  : "bg-slate-950/60 border-slate-800/80 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="space-y-3">
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        {strategy.category}
                      </span>
                      {strategy.isCustom && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-white mt-1.5">{strategy.name}</h3>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => toggleStrategyActive(strategy.id, !isActive)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      isActive
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isActive ? "ACTIVE" : "PAUSED"}
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {strategy.description}
                </p>

                {/* Target Assets & Timeframes */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(strategy.timeframes || ["15m", "1h"]).map((tf) => (
                    <span key={tf} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      {tf}
                    </span>
                  ))}
                  {(strategy.targetAssets || []).slice(0, 3).map((a) => (
                    <span key={a} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Win Rate</span>
                    <span className="text-emerald-400 font-bold">{strategy.winRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Profit Factor</span>
                    <span className="text-indigo-300 font-bold">{strategy.profitFactor}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Weight</span>
                    <span className="text-cyan-400 font-bold">{strategy.weight}%</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-slate-500 font-mono">
                    SL: {strategy.stopLossPercent}% | TP: {strategy.takeProfitPercent}%
                  </div>

                  {strategy.isCustom && (
                    <button
                      onClick={() => deleteStrategy(strategy.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete strategy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
