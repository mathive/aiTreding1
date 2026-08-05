"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatPercent } from "@/lib/utils";
import {
  Radar,
  Search,
  Sparkles,
  Star,
  LineChart,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Filter,
} from "lucide-react";

export const MarketScannerView: React.FC = () => {
  const {
    marketAssets,
    setSelectedSymbol,
    setActiveTab,
    setOrderModalSymbol,
    watchlists,
    addToWatchlist,
    removeFromWatchlist,
    runScanAndTrade,
    isScanning,
  } = useApp();

  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"aiConfidence" | "change24h" | "volume">("aiConfidence");

  const filteredAssets = marketAssets
    .filter((a) => (marketFilter === "all" ? true : a.market === marketFilter))
    .filter(
      (a) =>
        a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "aiConfidence") return b.aiConfidence - a.aiConfidence;
      if (sortBy === "change24h") return b.change24h - a.change24h;
      return 0;
    });

  const isFavorite = (symbol: string) => watchlists.some((w) => w.symbol === symbol);

  const toggleFavorite = async (symbol: string) => {
    const item = watchlists.find((w) => w.symbol === symbol);
    if (item) {
      await removeFromWatchlist(item.id);
    } else {
      await addToWatchlist(symbol);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Live AI Market Scanner</h1>
              <p className="text-xs text-slate-400">Real-time technical indicators & AI confluence scoring across 12 instruments</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => runScanAndTrade(true)}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-950/60 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isScanning ? "animate-spin text-cyan-200" : "text-yellow-300"}`} />
          {isScanning ? "Scanning..." : "Rescan All Pairs"}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["all", "crypto", "stocks", "forex"].map((m) => (
            <button
              key={m}
              onClick={() => setMarketFilter(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                marketFilter === m
                  ? "bg-cyan-950 border border-cyan-700 text-cyan-300"
                  : "bg-slate-950/60 text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              {m === "all" ? "All Markets" : m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ticker, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="aiConfidence">Sort: Highest AI Score</option>
            <option value="change24h">Sort: 24h Top Gainers</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800 bg-slate-950/70">
              <tr>
                <th className="py-3 px-4">Watch</th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Price (USD)</th>
                <th className="py-3 px-4">24h Change</th>
                <th className="py-3 px-4">RSI (14)</th>
                <th className="py-3 px-4">EMA Alignment</th>
                <th className="py-3 px-4">AI Confluence</th>
                <th className="py-3 px-4">Trend Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAssets.map((asset) => {
                const isPositive = asset.change24h >= 0;
                const fav = isFavorite(asset.symbol);

                return (
                  <tr key={asset.symbol} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleFavorite(asset.symbol)}
                        className="text-slate-600 hover:text-yellow-400 transition-colors cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${fav ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          onClick={() => {
                            setSelectedSymbol(asset.symbol);
                            setActiveTab("terminal");
                          }}
                          className="font-sans font-bold text-white hover:text-cyan-400 cursor-pointer"
                        >
                          {asset.symbol}
                        </div>
                        <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                          {asset.market}
                        </span>
                      </div>
                      <span className="text-[10px] font-sans text-slate-500 block truncate">{asset.name}</span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-200">
                      ${asset.currentPrice < 10 ? asset.currentPrice.toFixed(4) : asset.currentPrice.toLocaleString()}
                    </td>

                    <td className={`py-3 px-4 font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatPercent(asset.change24h)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`font-semibold ${asset.rsi > 70 ? "text-amber-400" : asset.rsi < 30 ? "text-cyan-400" : "text-slate-300"}`}>
                        {asset.rsi.toFixed(1)}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        asset.emaTrend === "STRONG_UPTREND" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                        asset.emaTrend === "UPTREND" ? "bg-cyan-950 text-cyan-300 border border-cyan-800" :
                        asset.emaTrend === "DOWNTREND" ? "bg-rose-950 text-rose-300 border border-rose-800" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {asset.emaTrend.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                            style={{ width: `${asset.aiConfidence}%` }}
                          />
                        </div>
                        <span className="font-bold text-cyan-400">{asset.aiConfidence}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        asset.trendStatus === "STRONG_BUY" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                        asset.trendStatus === "BUY" ? "bg-teal-500/20 text-teal-300 border border-teal-500/40" :
                        asset.trendStatus === "SELL" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {asset.trendStatus.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 font-sans">
                        <button
                          onClick={() => setOrderModalSymbol(asset.symbol)}
                          className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg text-[11px] font-bold text-white transition-all cursor-pointer shadow-sm"
                        >
                          Trade
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSymbol(asset.symbol);
                            setActiveTab("terminal");
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-medium text-slate-300 transition-colors cursor-pointer"
                        >
                          Chart
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
    </div>
  );
};
