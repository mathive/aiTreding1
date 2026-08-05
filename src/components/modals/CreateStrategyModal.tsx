"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { X, Sparkles, Sliders, Layers, Check, Bot } from "lucide-react";

export const CreateStrategyModal: React.FC = () => {
  const { isCreateStratModalOpen, setIsCreateStratModalOpen, createStrategy } = useApp();

  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Form fields
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<string>("momentum");
  const [description, setDescription] = useState<string>("");
  const [traderTypeMatch, setTraderTypeMatch] = useState<string>("all");
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>(["15m", "1h"]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(["BTC/USDT", "SOL/USDT", "NVDA"]);
  const [weight, setWeight] = useState<number>(30);
  const [minConfidence, setMinConfidence] = useState<number>(75);
  const [stopLossPercent, setStopLossPercent] = useState<string>("2.00");
  const [takeProfitPercent, setTakeProfitPercent] = useState<string>("5.50");
  const [trailingStop, setTrailingStop] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isCreateStratModalOpen) return null;

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Create custom strategy: ${aiPrompt}` }),
      });
      const data = await res.json();
      if (data.suggestedStrategy) {
        const strat = data.suggestedStrategy;
        setName(strat.name || "AI Trend Strategy");
        setCategory(strat.category || "momentum");
        setDescription(strat.description || "AI generated custom algorithm");
        setTraderTypeMatch(strat.traderTypeMatch || "all");
        if (strat.timeframes) setSelectedTimeframes(strat.timeframes);
        if (strat.targetAssets) setSelectedAssets(strat.targetAssets);
        if (strat.stopLossPercent) setStopLossPercent(strat.stopLossPercent);
        if (strat.takeProfitPercent) setTakeProfitPercent(strat.takeProfitPercent);
        setMode("manual");
      }
    } catch {
      // fallback
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await createStrategy({
      name: name || "Custom Trend Strategy",
      description: description || "Multi-indicator trending strategy",
      category,
      traderTypeMatch,
      timeframes: selectedTimeframes,
      targetAssets: selectedAssets,
      indicators: { emaFast: 20, emaSlow: 50, rsiThreshold: 55, dynamicAtr: true },
      weight,
      minConfidence,
      stopLossPercent,
      takeProfitPercent,
      trailingStop,
      aiPromptOrigin: aiPrompt || undefined,
    });

    setIsSubmitting(false);
    if (success) {
      setIsCreateStratModalOpen(false);
    }
  };

  const timeframesList = ["1m", "5m", "15m", "1h", "4h", "1D"];
  const assetsList = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "NVDA", "TSLA", "AAPL", "XAU/USD", "EUR/USD"];

  const toggleTf = (tf: string) => {
    setSelectedTimeframes((prev) =>
      prev.includes(tf) ? prev.filter((t) => t !== tf) : [...prev, tf]
    );
  };

  const toggleAsset = (a: string) => {
    setSelectedAssets((prev) =>
      prev.includes(a) ? prev.filter((item) => item !== a) : [...prev, a]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950 border border-purple-800 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Strategy Architect</h3>
              <p className="text-xs text-slate-400">Build or AI-generate trending trading systems</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateStratModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === "ai"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            AI Prompt Generator
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === "manual"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/40"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4 text-cyan-200" />
            Manual Strategy Builder
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {mode === "ai" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Describe what strategy you want Nexus AI to build:
                </label>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Create a high-momentum trend breakout strategy for SOL and BTC that buys when 15m EMA20 crosses EMA50 with 1.8x volume surge and 80% AI confidence..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              {/* Sample Prompts */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Quick Prompt Ideas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "5-minute Crypto Scalping with RSI & VWAP",
                    "4-hour NVDA & Tech Breakout Squeeze",
                    "Gold Spot Smart Money Liquidity Sweep",
                    "Mean Reversion 0.618 Fib Bounce for Swing Traders",
                  ].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAiPrompt(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 hover:text-purple-300 hover:border-purple-800 cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-purple-950/60 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                {isGenerating ? "Synthesizing Strategy Architecture..." : "Generate Strategy Configuration"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Strategy Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Volatility Pulse Surge"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Category Archetype
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="momentum">Momentum Trend Surge</option>
                    <option value="breakout">Channel / Range Breakout</option>
                    <option value="smart_money">Smart Money & Liquidity Order Flow</option>
                    <option value="mean_reversion">Mean Reversion / Fib Reversal</option>
                    <option value="ml_ai">Neural / AI Ensemble Model</option>
                    <option value="sentiment">News & Social Sentiment NLP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                  Strategy Rationale & Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain how this strategy enters and exits trending markets..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  required
                />
              </div>

              {/* Timeframes */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
                  Active Confluence Timeframes
                </label>
                <div className="flex gap-2">
                  {timeframesList.map((tf) => {
                    const active = selectedTimeframes.includes(tf);
                    return (
                      <button
                        type="button"
                        key={tf}
                        onClick={() => toggleTf(tf)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          active
                            ? "bg-cyan-950 border-cyan-700 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {tf}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Assets */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
                  Target Markets & Assets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {assetsList.map((a) => {
                    const active = selectedAssets.includes(a);
                    return (
                      <button
                        type="button"
                        key={a}
                        onClick={() => toggleAsset(a)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                          active
                            ? "bg-indigo-950 border-indigo-700 text-indigo-300 font-semibold"
                            : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders for SL / TP / Weight */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Stop Loss %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={stopLossPercent}
                    onChange={(e) => setStopLossPercent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-rose-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Take Profit %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="30"
                    value={takeProfitPercent}
                    onChange={(e) => setTakeProfitPercent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Confluence Weight
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    max="100"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <input
                  type="checkbox"
                  id="stratTrailing"
                  checked={trailingStop}
                  onChange={(e) => setTrailingStop(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                />
                <label htmlFor="stratTrailing" className="text-xs text-slate-300 cursor-pointer font-medium">
                  Auto-enable Trailing Stop for trades generated by this strategy
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-cyan-950/60 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                {isSubmitting ? "Deploying..." : "Save & Add to Autonomous Bot"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
