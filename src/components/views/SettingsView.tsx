"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import {
  Settings,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Key,
  Check,
  Sparkles,
  User,
  Zap,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const {
    user,
    updateUserSettings,
    resetBalance,
    showToast,
    refreshAllData,
  } = useApp();

  const [name, setName] = useState<string>(user?.name || "");
  const [traderType, setTraderType] = useState<string>(user?.traderType || "day_trader");
  const [riskMode, setRiskMode] = useState<string>(user?.riskMode || "moderate");
  const [maxDailyLoss, setMaxDailyLoss] = useState<string>(user?.maxDailyLoss || "2500");
  const [maxLeverage, setMaxLeverage] = useState<number>(user?.maxLeverage || 10);
  const [soundEffects, setSoundEffects] = useState<boolean>(user?.soundEffects !== false);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState<boolean>(user?.autoTradingEnabled !== false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isResettingDb, setIsResettingDb] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateUserSettings({
      name,
      traderType,
      riskMode,
      maxDailyLoss,
      maxLeverage,
      soundEffects,
      autoTradingEnabled,
    });
    setIsSaving(false);
  };

  const handleFullReset = async () => {
    if (!confirm("Are you sure you want to reset all demo database records and restore fresh simulated data?")) return;
    setIsResettingDb(true);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      if (res.ok) {
        showToast("Database successfully restored to default demo state!", "success");
        await refreshAllData();
      }
    } catch {
      showToast("Reset failed", "error");
    } finally {
      setIsResettingDb(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Trader Settings & Risk Guardrails</h1>
          <p className="text-xs text-slate-400">Configure account parameters, autonomous risk limits, and broker connections</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            Trader Persona Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Trader Category
              </label>
              <select
                value={traderType}
                onChange={(e) => setTraderType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="day_trader">Intraday Momentum & Breakouts (Day Trader)</option>
                <option value="scalper">Fast 1m/5m Order Flow Scalper</option>
                <option value="swing_trader">Multi-Day Trend Follower (Swing Trader)</option>
                <option value="quant">Algorithmic & Statistical Confluence (Quant)</option>
                <option value="crypto">Crypto High-Volatility Specialist</option>
              </select>
            </div>
          </div>
        </div>

        {/* Risk & Safety Limits */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Autonomous Risk Protection
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Max Daily Loss Safety Circuit ($)
              </label>
              <input
                type="number"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                If daily losses reach this amount, AI auto-pauses all new executions.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Max Allowed Leverage ({maxLeverage}x)
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={maxLeverage}
                onChange={(e) => setMaxLeverage(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-400 mt-3"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Risk Engine Mode
              </label>
              <select
                value={riskMode}
                onChange={(e) => setRiskMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="conservative">Conservative (Tight SL, 1:3 R/R)</option>
                <option value="moderate">Moderate (Standard Trailing Stops)</option>
                <option value="aggressive">Aggressive (Wide Channels, Momentum)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <input
                type="checkbox"
                id="autoTradeToggle"
                checked={autoTradingEnabled}
                onChange={(e) => setAutoTradingEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 cursor-pointer accent-cyan-500"
              />
              <label htmlFor="autoTradeToggle" className="text-xs text-slate-300 cursor-pointer">
                <strong>Autonomous Execution Engine</strong>
                <span className="block text-[11px] text-slate-500">Allow AI to take trades automatically upon confluence</span>
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <input
                type="checkbox"
                id="soundToggle"
                checked={soundEffects}
                onChange={(e) => setSoundEffects(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 cursor-pointer accent-cyan-500"
              />
              <label htmlFor="soundToggle" className="text-xs text-slate-300 cursor-pointer">
                <strong>Audio Chimes & Sound FX</strong>
                <span className="block text-[11px] text-slate-500">Play audio signals on trade fills and take-profit triggers</span>
              </label>
            </div>
          </div>
        </div>

        {/* Simulated Broker API Keys Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            Simulated Exchange & Broker Integrations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: "Binance Futures", status: "CONNECTED (PAPER)", latency: "12ms" },
              { name: "Bybit Linear", status: "CONNECTED (PAPER)", latency: "18ms" },
              { name: "Alpaca Equities", status: "CONNECTED (PAPER)", latency: "24ms" },
              { name: "Interactive Brokers", status: "SIMULATED GATEWAY", latency: "35ms" },
            ].map((broker) => (
              <div key={broker.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{broker.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-emerald-400 font-mono font-semibold">{broker.status}</p>
                <span className="text-[9px] text-slate-500 font-mono">Ping: {broker.latency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleFullReset}
            disabled={isResettingDb}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 rounded-xl text-xs font-semibold text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            {isResettingDb ? "Resetting Demo Database..." : "Reset All Demo Data"}
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-cyan-950/60 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {isSaving ? "Saving Settings..." : "Save All Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
};
