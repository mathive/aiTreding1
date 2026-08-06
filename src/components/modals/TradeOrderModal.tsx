"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { X, ShieldAlert, Sparkles, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export const TradeOrderModal: React.FC = () => {
  const {
    orderModalSymbol,
    setOrderModalSymbol,
    marketAssets,
    executeTrade,
    user,
    strategies,
  } = useApp();

  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [amount, setAmount] = useState<number>(0.01);
  const [leverage, setLeverage] = useState<number>(5);
  const [stopLoss, setStopLoss] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [trailingStop, setTrailingStop] = useState<boolean>(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const asset = marketAssets.find((a) => a.symbol === orderModalSymbol) || marketAssets[0];
  const signalQualified = Boolean((asset as any)?.tradeEligible && asset?.aiConfidence >= 80 && ((asset as any)?.alignmentCount ?? 0) >= 3);
  const signalSide: "BUY" | "SELL" | null = signalQualified && asset?.trendStatus.includes("BUY")
    ? "BUY" : signalQualified && asset?.trendStatus.includes("SELL") ? "SELL" : null;

  useEffect(() => {
    if (asset) {
      if (signalSide && tradeType !== signalSide) {
        setTradeType(signalSide);
        return;
      }
      const price = asset.currentPrice;
      const isLong = tradeType === "BUY";
      const sl = (asset as any).recommendedStopLoss ?? (isLong ? price * 0.998 : price * 1.002);
      const tp = (asset as any).recommendedTakeProfit ?? (isLong ? price * 1.006 : price * 0.994);
      setStopLoss(sl.toFixed(price < 10 ? 4 : 2));
      setTakeProfit(tp.toFixed(price < 10 ? 4 : 2));
      setLeverage(asset.recommendedLeverage || 5);
      // Default to broker min lot size
      setAmount((asset as any).volumeMin ?? 0.01);
      if (strategies.length > 0 && !selectedStrategy) {
        setSelectedStrategy(strategies[0].name);
      }
    }
  }, [orderModalSymbol, tradeType, asset, signalSide]);

  if (!orderModalSymbol || !asset) return null;

  const currentPrice = asset.currentPrice;
  const positionSize = amount * leverage;
  const quantity = positionSize / currentPrice;

  const slPrice = parseFloat(stopLoss) || (tradeType === "BUY" ? currentPrice * 0.998 : currentPrice * 1.002);
  const tpPrice = parseFloat(takeProfit) || (tradeType === "BUY" ? currentPrice * 1.006 : currentPrice * 0.994);

  const potentialLoss = Math.abs(((currentPrice - slPrice) / currentPrice) * positionSize);
  const potentialGain = Math.abs(((tpPrice - currentPrice) / currentPrice) * positionSize);
  const riskReward = (potentialGain / (potentialLoss || 1)).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signalSide || tradeType !== signalSide) return;
    setIsSubmitting(true);

    const success = await executeTrade({
      symbol: asset.symbol,
      market: asset.market,
      type: tradeType,
      amount,
      leverage,
      stopLoss: slPrice,
      takeProfit: tpPrice,
      trailingStop,
      strategyUsed: selectedStrategy || "AI Confluence Order",
      aiConfidence: asset.aiConfidence || 85,
      aiReasoning: `Manual AI-assisted ${tradeType} entry on ${asset.symbol}. Confluence score: ${asset.aiConfidence}%. Expected R/R 1:${riskReward}.`,
      executionType: "manual_assisted",
    });

    setIsSubmitting(false);
    if (success) {
      setOrderModalSymbol(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{asset.displaySymbol || asset.symbol}</h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {asset.market}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live Price: <span className="font-mono text-white font-semibold">${currentPrice.toLocaleString()}</span>
                {" "}(<span className={asset.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}>{formatPercent(asset.change24h)}</span>)
              </p>
            </div>
          </div>

          <button
            onClick={() => setOrderModalSymbol(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Buy (Long) / Sell (Short) Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => signalSide === "BUY" && setTradeType("BUY")}
              disabled={signalSide !== "BUY"}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tradeType === "BUY" && signalSide === "BUY"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "text-slate-600 cursor-not-allowed opacity-50"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              BUY / LONG
            </button>
            <button
              type="button"
              onClick={() => signalSide === "SELL" && setTradeType("SELL")}
              disabled={signalSide !== "SELL"}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tradeType === "SELL" && signalSide === "SELL"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "text-slate-600 cursor-not-allowed opacity-50"
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              SELL / SHORT
            </button>
          </div>

          {/* AI Confluence Recommendation Pill */}
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-300 font-medium">AI Confluence Rating:</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-white">{asset.aiConfidence}%</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-cyan-900 text-cyan-200">
                {asset.trendStatus}
              </span>
            </div>
          </div>

          {/* Lot Size from MT5 broker + Leverage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Volume (Lots) — Broker Min: {(asset as any).volumeMin ?? 0.01}
              </label>
              <input
                type="number"
                min={(asset as any).volumeMin ?? 0.01}
                step={(asset as any).volumeStep ?? 0.01}
                value={amount}
                onChange={(e) => setAmount(Math.max((asset as any).volumeMin ?? 0.01, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Min lot: {(asset as any).volumeMin ?? 0.01} • Step: {(asset as any).volumeStep ?? 0.01}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase text-slate-400">
                  Leverage: <span className="text-cyan-400 font-mono font-bold">{leverage}x</span>
                </label>
                <span className="text-[10px] text-slate-500">Max {asset.market === "crypto" ? "50x" : "20x"}</span>
              </div>
              <input
                type="range"
                min="1"
                max={asset.market === "crypto" ? 20 : 10}
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Notional: <span className="text-white font-semibold">{formatCurrency(positionSize)}</span>
              </div>
            </div>
          </div>

          {/* Stop Loss & Take Profit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Stop Loss (Price)
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
                required
              />
              <span className="text-[10px] text-rose-400 font-mono mt-1 block">
                Max Downside: -{formatCurrency(potentialLoss)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Take Profit (Target)
              </label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                required
              />
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                Target Return: +{formatCurrency(potentialGain)}
              </span>
            </div>
          </div>

          {/* Trailing Stop & Strategy Selector */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="trailingStopToggle"
                checked={trailingStop}
                onChange={(e) => setTrailingStop(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
              />
              <label htmlFor="trailingStopToggle" className="text-xs text-slate-300 cursor-pointer font-medium">
                Activate Dynamic AI Trailing Stop
              </label>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">R/R 1:{riskReward}</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !signalSide}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
              tradeType === "BUY"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/60"
                : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-950/60"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting
              ? "Executing Order..."
              : !signalSide ? "No Trade — Neutral Signal"
              : `Execute ${tradeType} on ${asset.symbol} (${formatCurrency(positionSize)})`}
          </button>
        </form>
      </div>
    </div>
  );
};
