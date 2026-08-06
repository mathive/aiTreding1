"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { formatPercent, formatCurrency, playSound } from "@/lib/utils";
import {
  Radar,
  Bell,
  BellRing,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Timer,
  Play,
  Pause,
  X,
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
  Eye,
  ToggleLeft,
  ToggleRight,
  Settings,
} from "lucide-react";

interface PriceFeedItem {
  symbol: string;
  displaySymbol?: string;
  name: string;
  market: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  rsi14: number;
  emaShort: number;
  emaLong: number;
  macdSignal: string;
  emaTrend: string;
  confluenceScore: number;
  confluenceSignal: string;
  confluenceDirection: string;
  aiConfidence: number;
  trendStatus: string;
  targetTP1: number;
  stopLossPrice: number;
  riskRewardRatio: number;
  aiSummary: string;
  timestamp: number;
}

interface AlertItem {
  id: string;
  symbol: string;
  name: string;
  market: string;
  alertType: string;
  targetValue: string;
  currentValue: string | null;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt: string | null;
  livePrice?: number;
  distancePercent?: string;
}

export const PriceScanView: React.FC = () => {
  const { user, showToast, setOrderModalSymbol, setSelectedSymbol, setActiveTab, refreshAllData,
    priceScannerAutoEnabled: isAutoScanning, setPriceScannerAutoEnabled: setIsAutoScanning,
    priceScannerInterval: scanInterval, setPriceScannerInterval: setScanInterval } = useApp();

  const [feedData, setFeedData] = useState<PriceFeedItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [flashSymbols, setFlashSymbols] = useState<Set<string>>(new Set());
  const prevPrices = useRef<Record<string, number>>({});
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Alert form state
  const [alertSymbol, setAlertSymbol] = useState("BTCUSD");
  const [alertType, setAlertType] = useState("price_above");
  const [alertTargetValue, setAlertTargetValue] = useState("");
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/price-feed");
      if (res.ok) {
        const data = await res.json();
        const items: PriceFeedItem[] = data.feed || [];

        // Determine which prices changed
        const newFlash = new Set<string>();
        items.forEach((item) => {
          const prev = prevPrices.current[item.symbol];
          if (prev !== undefined && Math.abs(item.price - prev) / prev > 0.0001) {
            newFlash.add(item.symbol);
          }
          prevPrices.current[item.symbol] = item.price;
        });
        setFlashSymbols(newFlash);
        setTimeout(() => setFlashSymbols(new Set()), 600);

        setFeedData(items);
        setLastScanTime(Date.now());
        setScanCount((c) => c + 1);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/price-alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch { /* ignore */ }
  }, []);

  const checkAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/price-alerts/check", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.triggeredCount > 0) {
          if (user?.soundEffects) playSound("profit");
          showToast(`🔔 ${data.triggeredCount} price alert(s) triggered!`, "success");
          fetchAlerts();
          refreshAllData();
        }
      }
    } catch { /* ignore */ }
  }, [user?.soundEffects, showToast, fetchAlerts, refreshAllData]);

  // Initial load
  useEffect(() => {
    fetchFeed();
    fetchAlerts();
  }, [fetchFeed, fetchAlerts]);

  // Auto-scan loop
  useEffect(() => {
    if (isAutoScanning) {
      scanIntervalRef.current = setInterval(() => {
        fetchFeed();
        checkAlerts();
      }, scanInterval * 1000);
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isAutoScanning, scanInterval, fetchFeed, checkAlerts]);

  const toggleAutoScan = () => {
    const next = !isAutoScanning;
    setIsAutoScanning(next);
    if (next) {
      if (user?.soundEffects) playSound("scan");
      showToast(`Auto-scan started (every ${scanInterval}s)`, "info");
      fetchFeed();
    } else {
      showToast("Auto-scan paused", "info");
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTargetValue) return;
    setIsCreatingAlert(true);
    try {
      const res = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: alertSymbol,
          alertType,
          targetValue: parseFloat(alertTargetValue),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message, "success");
        setShowAlertModal(false);
        setAlertTargetValue("");
        fetchAlerts();
      }
    } catch { showToast("Failed to create alert", "error"); }
    finally { setIsCreatingAlert(false); }
  };

  const handleToggleAlert = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/price-alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchAlerts();
    } catch { /* ignore */ }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await fetch(`/api/price-alerts/${id}`, { method: "DELETE" });
      fetchAlerts();
    } catch { /* ignore */ }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header with Scan Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Radar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white">Real-Time Price Scanner & Alert Engine</h1>
            <p className="text-xs text-slate-400">
              Live tick-by-tick price feed with AI confluence scoring, automatic alert triggers, and instant order routing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Scan Speed Selector */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <Timer className="w-3.5 h-3.5 text-slate-400" />
            {[1, 3, 5, 10, 30].map((s) => (
              <button
                key={s}
                onClick={() => setScanInterval(s)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  scanInterval === s
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {s}s
              </button>
            ))}
          </div>

          {/* Auto-Scan Toggle */}
          <button
            onClick={toggleAutoScan}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-lg ${
              isAutoScanning
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/80"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shadow-none"
            }`}
          >
            {isAutoScanning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAutoScanning ? "Auto-Scanning..." : "Start Auto-Scan"}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => { fetchFeed(); checkAlerts(); }}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scan Status Ribbon */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isAutoScanning ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            <span className="text-slate-400 font-mono">
              {isAutoScanning ? `Live feed: every ${scanInterval}s` : "Auto-scan paused"}
            </span>
          </div>
          <span className="text-slate-500 font-mono">Scans: {scanCount}</span>
          {lastScanTime && (
            <span className="text-slate-500 font-mono">
              Last: {new Date(lastScanTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Active Alerts: <strong className="text-cyan-400">{alerts.filter((a) => a.isActive).length}</strong></span>
          <button
            onClick={() => setShowAlertModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 rounded-xl text-[11px] font-bold text-cyan-300 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            New Alert
          </button>
        </div>
      </div>

      {/* Main Grid: Price Feed + Alerts Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Price Feed Table (3 cols) */}
        <div className="lg:col-span-3 rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800 bg-slate-950/70">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Bid / Ask</th>
                  <th className="py-3 px-4">Last Price</th>
                  <th className="py-3 px-4">24h Δ</th>
                  <th className="py-3 px-4">RSI</th>
                  <th className="py-3 px-4">EMA Trend</th>
                  <th className="py-3 px-4">AI Score</th>
                  <th className="py-3 px-4">Signal</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {feedData.map((item) => {
                  const isPositive = item.change24h >= 0;
                  const isFlashing = flashSymbols.has(item.symbol);
                  return (
                    <tr
                      key={item.symbol}
                      className={`transition-colors ${isFlashing ? "bg-cyan-950/30" : "hover:bg-slate-850/40"}`}
                    >
                      <td className="py-3 px-4">
                        <div
                          onClick={() => { setSelectedSymbol(item.symbol); setActiveTab("terminal"); }}
                          className="font-sans font-bold text-white hover:text-cyan-400 cursor-pointer"
                        >
                          {item.displaySymbol || item.symbol}
                        </div>
                        <span className="text-[10px] font-sans text-slate-500 capitalize">{item.market}</span>
                      </td>
                      <td className="py-3 px-4 text-[10px]">
                        <span className="text-emerald-400">{item.bid < 10 ? item.bid.toFixed(4) : item.bid.toLocaleString()}</span>
                        <span className="text-slate-600 mx-0.5">/</span>
                        <span className="text-rose-400">{item.ask < 10 ? item.ask.toFixed(4) : item.ask.toLocaleString()}</span>
                        <div className="text-[9px] text-slate-600">Spread: {item.spread} bps</div>
                      </td>
                      <td className={`py-3 px-4 font-bold text-sm ${isFlashing ? (isPositive ? "text-emerald-300" : "text-rose-300") : "text-white"}`}>
                        ${item.price < 10 ? item.price.toFixed(4) : item.price.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatPercent(item.change24h)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${item.rsi14 > 70 ? "text-amber-400" : item.rsi14 < 30 ? "text-cyan-400" : "text-slate-300"}`}>
                          {item.rsi14.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.emaTrend === "STRONG_UPTREND" ? "bg-emerald-950 text-emerald-300" :
                          item.emaTrend === "UPTREND" ? "bg-cyan-950 text-cyan-300" :
                          item.emaTrend === "DOWNTREND" ? "bg-rose-950 text-rose-300" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {item.emaTrend.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${item.confluenceScore}%` }}
                            />
                          </div>
                          <span className="font-bold text-cyan-400">{item.confluenceScore}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.confluenceSignal === "STRONG_BUY" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                          item.confluenceSignal === "BUY" ? "bg-teal-500/20 text-teal-300 border border-teal-500/40" :
                          item.confluenceSignal === "SELL" || item.confluenceSignal === "STRONG_SELL" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {item.confluenceSignal.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setOrderModalSymbol(item.symbol)}
                            className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 rounded-lg text-[10px] font-bold text-emerald-200 cursor-pointer"
                          >
                            Trade
                          </button>
                          <button
                            onClick={() => { setAlertSymbol(item.symbol); setShowAlertModal(true); }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 cursor-pointer"
                          >
                            <Bell className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts Sidebar (1 col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Price Alerts</h3>
              </div>
              <button
                onClick={() => setShowAlertModal(true)}
                className="p-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 rounded-lg text-cyan-400 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                <Bell className="w-6 h-6 text-slate-600 mx-auto" />
                <p>No alerts configured</p>
                <p className="text-[10px]">Set price targets and get notified when they trigger</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      alert.isTriggered
                        ? "bg-amber-950/30 border-amber-800/60"
                        : alert.isActive
                        ? "bg-slate-950/60 border-slate-800"
                        : "bg-slate-950/30 border-slate-800/50 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{alert.symbol}</span>
                      <div className="flex items-center gap-1">
                        {alert.isTriggered && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-400 font-bold">TRIGGERED</span>
                        )}
                        <button
                          onClick={() => handleToggleAlert(alert.id, alert.isActive)}
                          className="cursor-pointer"
                        >
                          {alert.isActive ? (
                            <ToggleRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-slate-600 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {alert.alertType.replace(/_/g, " ")}: <span className="text-cyan-300 font-mono font-bold">${alert.targetValue}</span>
                    </p>
                    {alert.distancePercent && (
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Distance: {parseFloat(alert.distancePercent) >= 0 ? "+" : ""}{alert.distancePercent}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Create Price Alert</h3>
              </div>
              <button onClick={() => setShowAlertModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Asset</label>
                <select
                  value={alertSymbol}
                  onChange={(e) => setAlertSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {feedData.map((f) => (
                    <option key={f.symbol} value={f.symbol}>{f.symbol} — ${f.price < 10 ? f.price.toFixed(4) : f.price.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Alert Type</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="price_above">Price Rises Above Target</option>
                  <option value="price_below">Price Falls Below Target</option>
                  <option value="pct_change_up">24h Change Exceeds +X%</option>
                  <option value="pct_change_down">24h Change Drops Below -X%</option>
                  <option value="rsi_overbought">RSI Overbought (&gt; X)</option>
                  <option value="rsi_oversold">RSI Oversold (&lt; X)</option>
                  <option value="confluence_trigger">AI Confluence Score ≥ X%</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                  Target Value {alertType.includes("pct") ? "(%)" : alertType.includes("rsi") ? "(0-100)" : alertType.includes("confluence") ? "(%)" : "($)"}
                </label>
                <input
                  type="number"
                  step="any"
                  value={alertTargetValue}
                  onChange={(e) => setAlertTargetValue(e.target.value)}
                  placeholder={alertType.includes("pct") ? "e.g. 5" : alertType.includes("rsi") ? "e.g. 70" : "e.g. 95000"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingAlert}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-cyan-950/60 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                {isCreatingAlert ? "Creating..." : "Create Alert"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
