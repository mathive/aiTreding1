"use client";

import React, { useState } from "react";
import { usePersistentState } from "@/lib/use-persistent-state";
import { useApp, TradeItem } from "@/context/AppContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  History,
  TrendingUp,
  TrendingDown,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export const PositionsView: React.FC = () => {
  const {
    openTrades,
    closedTrades,
    closeTrade,
    deleteTrade,
    setEditTradeModalItem,
    setSelectedSymbol,
    setActiveTab,
  } = useApp();

  const [viewTab, setViewTab] = usePersistentState<"open" | "closed">("positions_tab", "open");
  const [searchQuery, setSearchQuery] = usePersistentState<string>("positions_search", "");

  const activeList = viewTab === "open" ? openTrades : closedTrades;
  const filteredList = activeList.filter(
    (t) =>
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.strategyUsed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCsv = () => {
    if (closedTrades.length === 0) return;
    const headers = "Symbol,Type,EntryPrice,ExitPrice,Amount,Leverage,PnL,PnLPercent,Strategy,EntryTime,ExitTime,CloseReason\n";
    const rows = closedTrades
      .map(
        (t) =>
          `"${t.symbol}","${t.type}",${t.entryPrice},${t.exitPrice || ""},${t.amount},${t.leverage},${t.pnl},${t.pnlPercent},"${t.strategyUsed}","${t.entryTime}","${t.exitTime || ""}","${t.closeReason || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus_trades_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Positions & Trade History</h1>
              <p className="text-xs text-slate-400">Track active exposure, manage trailing stops, and analyze trade logs</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={closedTrades.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Trade Logs (CSV)
          </button>
        </div>
      </div>

      {/* Sub-tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setViewTab("open")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              viewTab === "open"
                ? "bg-indigo-950 border border-indigo-700 text-indigo-200"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Active Positions ({openTrades.length})
          </button>
          <button
            onClick={() => setViewTab("closed")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              viewTab === "closed"
                ? "bg-indigo-950 border border-indigo-700 text-indigo-200"
                : "text-slate-400 hover:text-white"
            }`}
          >
            AI Closed History ({closedTrades.length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Filter trades by ticker, strategy..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            {viewTab === "open"
              ? "No active open positions matching your filter."
              : "No autonomous AI trades have closed yet. Open AI positions appear here after MT5 closes them."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800 bg-slate-950/70">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Entry Price</th>
                  <th className="py-3 px-4">{viewTab === "open" ? "Current Price" : "Exit Price"}</th>
                  <th className="py-3 px-4">Margin / Size</th>
                  <th className="py-3 px-4">PnL (USD / %)</th>
                  <th className="py-3 px-4">Strategy Confluence</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredList.map((trade) => {
                  const pnlNum = parseFloat(trade.pnl || "0");
                  const pnlPct = parseFloat(trade.pnlPercent || "0");
                  const isPositive = pnlNum >= 0;

                  return (
                    <tr key={trade.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold text-white">
                        <div
                          onClick={() => {
                            setSelectedSymbol(trade.symbol);
                            setActiveTab("terminal");
                          }}
                          className="hover:text-cyan-400 cursor-pointer flex items-center gap-1.5"
                        >
                          {trade.symbol}
                          <ArrowUpRight className="w-3 h-3 text-slate-500" />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            trade.type === "BUY"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : "bg-rose-950 text-rose-300 border border-rose-800"
                          }`}
                        >
                          {trade.type} {trade.leverage}x
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300">${parseFloat(trade.entryPrice).toLocaleString()}</td>

                      <td className="py-3 px-4 text-cyan-300 font-semibold">
                        ${trade.exitPrice ? parseFloat(trade.exitPrice).toLocaleString() : parseFloat(trade.currentPrice).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        ${parseFloat(trade.amount).toLocaleString()} (${formatCurrency(parseFloat(trade.amount) * trade.leverage)})
                      </td>

                      <td className={`py-3 px-4 font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {isPositive ? "+" : ""}${pnlNum.toFixed(2)} ({formatPercent(pnlPct)})
                      </td>

                      <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate">
                        {trade.strategyUsed}
                      </td>

                      <td className="py-3 px-4 text-[10px] text-slate-500 font-mono">
                        {new Date(trade.entryTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>

                      <td className="py-3 px-4 text-right font-sans">
                        {viewTab === "open" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditTradeModalItem(trade)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => closeTrade(trade.id, 100, "manual_close")}
                              className="px-2.5 py-1 rounded bg-rose-600/30 hover:bg-rose-600/60 border border-rose-500/50 text-[11px] font-bold text-rose-200 cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => deleteTrade(trade.id)}
                            className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
