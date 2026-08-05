"use client";

import React, { useState, useEffect } from "react";
import { useApp, TradeItem } from "@/context/AppContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { X, ShieldCheck, Check, DollarSign } from "lucide-react";

export const EditPositionModal: React.FC = () => {
  const { editTradeModalItem, setEditTradeModalItem, updateTrade, closeTrade } = useApp();

  const [stopLoss, setStopLoss] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [trailingStop, setTrailingStop] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [partialClosePercent, setPartialClosePercent] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (editTradeModalItem) {
      setStopLoss(editTradeModalItem.stopLoss || "");
      setTakeProfit(editTradeModalItem.takeProfit || "");
      setTrailingStop(Boolean(editTradeModalItem.trailingStop));
      setNotes(editTradeModalItem.notes || "");
    }
  }, [editTradeModalItem]);

  if (!editTradeModalItem) return null;

  const currentPrice = parseFloat(editTradeModalItem.currentPrice);
  const entryPrice = parseFloat(editTradeModalItem.entryPrice);
  const pnl = parseFloat(editTradeModalItem.pnl);
  const pnlPercent = parseFloat(editTradeModalItem.pnlPercent);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await updateTrade(editTradeModalItem.id, {
      stopLoss: stopLoss || null,
      takeProfit: takeProfit || null,
      trailingStop,
      notes,
    });
    setIsSubmitting(false);
    if (success) setEditTradeModalItem(null);
  };

  const handlePartialClose = async () => {
    setIsSubmitting(true);
    const success = await closeTrade(editTradeModalItem.id, partialClosePercent, "partial_manual_close");
    setIsSubmitting(false);
    if (success) setEditTradeModalItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Manage Position: {editTradeModalItem.symbol}</h3>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  editTradeModalItem.type === "BUY"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : "bg-rose-950 text-rose-300 border border-rose-800"
                }`}
              >
                {editTradeModalItem.type} {editTradeModalItem.leverage}x
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Entry: ${entryPrice.toLocaleString()} | Current: ${currentPrice.toLocaleString()} (
              <span className={pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} / {formatPercent(pnlPercent)}
              </span>
              )
            </p>
          </div>
          <button
            onClick={() => setEditTradeModalItem(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
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
                placeholder="e.g. 87000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Take Profit (Price)
              </label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="e.g. 93000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <input
              type="checkbox"
              id="editTrailing"
              checked={trailingStop}
              onChange={(e) => setTrailingStop(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
            />
            <label htmlFor="editTrailing" className="text-xs text-slate-300 cursor-pointer font-medium">
              Enable Dynamic Trailing Stop Guard
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Trade Journal Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes or trade setup rationale..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Partial Close Section */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Partial Position Close</span>
              <span className="font-mono text-cyan-400 font-bold">{partialClosePercent}%</span>
            </div>
            <div className="flex items-center gap-2">
              {[25, 50, 75].map((pct) => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => setPartialClosePercent(pct)}
                  className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-colors ${
                    partialClosePercent === pct
                      ? "bg-cyan-950 border-cyan-700 text-cyan-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handlePartialClose}
              disabled={isSubmitting}
              className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 rounded-xl text-xs font-semibold text-indigo-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Close {partialClosePercent}% at Market
            </button>
          </div>

          {/* Save Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-cyan-950/40 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Risk Parameters"}
          </button>
        </form>
      </div>
    </div>
  );
};
