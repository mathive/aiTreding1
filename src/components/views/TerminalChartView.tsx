"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { CandlePoint } from "@/lib/market-data";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Sliders,
  Maximize2,
  ChevronDown,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";

export const TerminalChartView: React.FC = () => {
  const {
    selectedSymbol,
    setSelectedSymbol,
    marketAssets,
    executeTrade,
    user,
    strategies,
  } = useApp();

  const [timeframe, setTimeframe] = useState<string>("1h");
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [loadingCandles, setLoadingCandles] = useState<boolean>(true);

  // Indicators toggle
  const [showEma, setShowEma] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(true);
  const [showRsi, setShowRsi] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);

  // Order placement state
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [tradeAmount, setTradeAmount] = useState<number>(2500);
  const [leverage, setLeverage] = useState<number>(5);
  const [stopLoss, setStopLoss] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [trailingStop, setTrailingStop] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const asset = marketAssets.find((a) => a.symbol === selectedSymbol) || marketAssets[0];

  // Fetch candle data
  useEffect(() => {
    let isMounted = true;
    async function fetchCandles() {
      setLoadingCandles(true);
      try {
        const res = await fetch(`/api/market/candles?symbol=${encodeURIComponent(asset.symbol)}&timeframe=${timeframe}&count=60`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setCandles(data.candles || []);
        }
      } catch (err) {
        console.error("Failed to load candles:", err);
      } finally {
        if (isMounted) setLoadingCandles(false);
      }
    }
    fetchCandles();
    return () => {
      isMounted = false;
    };
  }, [asset.symbol, timeframe]);

  // Update SL/TP defaults
  useEffect(() => {
    if (asset) {
      const price = asset.currentPrice;
      const isLong = orderType === "BUY";
      const sl = isLong ? price * 0.98 : price * 1.02;
      const tp = isLong ? price * 1.055 : price * 0.945;
      setStopLoss(sl.toFixed(price < 10 ? 4 : 2));
      setTakeProfit(tp.toFixed(price < 10 ? 4 : 2));
      setLeverage(asset.recommendedLeverage || 5);
    }
  }, [asset, orderType]);

  const currentPrice = asset.currentPrice;
  const positionSize = tradeAmount * leverage;
  const slPrice = parseFloat(stopLoss) || currentPrice * 0.98;
  const tpPrice = parseFloat(takeProfit) || currentPrice * 1.055;

  const potentialLoss = Math.abs(((currentPrice - slPrice) / currentPrice) * positionSize);
  const potentialGain = Math.abs(((tpPrice - currentPrice) / currentPrice) * positionSize);
  const riskReward = (potentialGain / (potentialLoss || 1)).toFixed(2);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);
    await executeTrade({
      symbol: asset.symbol,
      market: asset.market,
      type: orderType,
      amount: tradeAmount,
      leverage,
      stopLoss: slPrice,
      takeProfit: tpPrice,
      trailingStop,
      strategyUsed: "Terminal AI Confluence Order",
      aiConfidence: asset.aiConfidence || 88,
      aiReasoning: `Terminal AI ${orderType} on ${asset.symbol}. Confluence: ${asset.aiConfidence}%, R/R 1:${riskReward}.`,
      executionType: "manual_assisted",
    });
    setIsExecuting(false);
  };

  const isPositive = asset.change24h >= 0;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header & Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-4">
          {/* Asset Selector */}
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {marketAssets.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol} ({a.market.toUpperCase()})
              </option>
            ))}
          </select>

          {/* Live Price & Change */}
          <div className="flex items-center gap-2 font-mono">
            <span className="text-xl font-extrabold text-white">
              ${currentPrice < 10 ? currentPrice.toFixed(4) : currentPrice.toLocaleString()}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                isPositive ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
              }`}
            >
              {formatPercent(asset.change24h)}
            </span>
          </div>
        </div>

        {/* Timeframe & Indicators */}
        <div className="flex items-center gap-2">
          {/* Timeframes */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {["1m", "5m", "15m", "1h", "4h", "1D"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  timeframe === tf
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicators Toggle Pill */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-medium">
            <button
              onClick={() => setShowEma(!showEma)}
              className={`px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                showEma ? "bg-indigo-950 text-indigo-300 border border-indigo-800" : "text-slate-500"
              }`}
            >
              EMA 20/50
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                showBollinger ? "bg-purple-950 text-purple-300 border border-purple-800" : "text-slate-500"
              }`}
            >
              Bollinger Bands
            </button>
            <button
              onClick={() => setShowRsi(!showRsi)}
              className={`px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                showRsi ? "bg-cyan-950 text-cyan-300 border border-cyan-800" : "text-slate-500"
              }`}
            >
              RSI (14)
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left 3 Cols: Interactive Chart Area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">{asset.symbol} • {timeframe} Chart</span>
                {showEma && (
                  <span className="text-[10px] font-mono text-cyan-400">
                    EMA20: ${candles[candles.length - 1]?.ema20 || "-"} | EMA50: ${candles[candles.length - 1]?.ema50 || "-"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-mono">AI Signal Markers Active</span>
              </div>
            </div>

            {/* Price Chart */}
            <div className="h-[380px] w-full">
              {loadingCandles ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  Loading Market Candlesticks...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={candles} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis
                      domain={["auto", "auto"]}
                      orientation="right"
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(val) => `$${val < 10 ? val.toFixed(3) : val.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "12px", fontSize: "11px" }}
                      labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                    />

                    {/* Area fill for trend */}
                    <Area type="monotone" dataKey="close" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#priceGradient)" />

                    {/* EMA Lines */}
                    {showEma && (
                      <>
                        <Line type="monotone" dataKey="ema20" stroke="#38bdf8" strokeWidth={1.5} dot={false} name="EMA 20" />
                        <Line type="monotone" dataKey="ema50" stroke="#a855f7" strokeWidth={1.5} dot={false} name="EMA 50" />
                      </>
                    )}

                    {/* Bollinger Bands */}
                    {showBollinger && (
                      <>
                        <Line type="monotone" dataKey="bbUpper" stroke="#64748b" strokeDasharray="3 3" strokeWidth={1} dot={false} name="BB Upper" />
                        <Line type="monotone" dataKey="bbLower" stroke="#64748b" strokeDasharray="3 3" strokeWidth={1} dot={false} name="BB Lower" />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* RSI Oscillator Subchart */}
            {showRsi && (
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] px-2 mb-1">
                  <span className="font-bold text-slate-400">RSI (14) Oscillator</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {candles[candles.length - 1]?.rsi || 55}
                  </span>
                </div>
                <div className="h-[90px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={candles} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.4} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[0, 100]} ticks={[30, 50, 70]} orientation="right" stroke="#64748b" tick={{ fontSize: 9, fill: "#64748b" }} />
                      <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.6} />
                      <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.6} />
                      <Line type="monotone" dataKey="rsi" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Order Placement & Risk Panel */}
        <div className="space-y-4">
          <form
            onSubmit={handleExecute}
            className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Place Order</h3>
              <span className="text-[10px] font-mono text-slate-400">{asset.symbol}</span>
            </div>

            {/* Buy / Sell Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setOrderType("BUY")}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  orderType === "BUY"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                LONG
              </button>
              <button
                type="button"
                onClick={() => setOrderType("SELL")}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  orderType === "SELL"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                SHORT
              </button>
            </div>

            {/* Margin Amount */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Margin Capital (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-xs">$</span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Math.max(10, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Leverage Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase text-slate-400">
                  Leverage: <span className="text-cyan-400 font-mono font-bold">{leverage}x</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Size: {formatCurrency(positionSize)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={asset.market === "crypto" ? 20 : 10}
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* SL / TP */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                  Stop Loss Price
                </label>
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-rose-300"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                  Take Profit Price
                </label>
                <input
                  type="number"
                  step="any"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-emerald-300"
                  required
                />
              </div>
            </div>

            {/* Risk / Reward Pill */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Return:</span>
                <span className="font-mono font-bold text-emerald-400">+{formatCurrency(potentialGain)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Max Downside:</span>
                <span className="font-mono font-bold text-rose-400">-{formatCurrency(potentialLoss)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                <span className="text-slate-300 font-semibold">Risk / Reward Ratio:</span>
                <span className="font-mono font-bold text-cyan-400">1:{riskReward}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isExecuting}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                orderType === "BUY"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                  : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {isExecuting ? "Placing Trade..." : `Execute ${orderType} (${formatCurrency(positionSize)})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
