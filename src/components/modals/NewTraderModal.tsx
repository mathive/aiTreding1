"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { X, UserPlus, Sparkles } from "lucide-react";

interface NewTraderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTraderModal: React.FC<NewTraderModalProps> = ({ isOpen, onClose }) => {
  const { createAndSwitchUser } = useApp();

  const [name, setName] = useState("");
  const [traderType, setTraderType] = useState("day_trader");
  const [initialBalance, setInitialBalance] = useState<number>(50000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await createAndSwitchUser(name.trim(), traderType, initialBalance);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Create Trader Persona</h3>
              <p className="text-xs text-slate-400">Configure customized trading profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Trader Full Name / Handle
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marcus King"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Primary Trading Style
            </label>
            <select
              value={traderType}
              onChange={(e) => setTraderType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="day_trader">Intraday Momentum & Breakouts (Day Trader)</option>
              <option value="scalper">Fast 1m/5m Order Flow Scalper</option>
              <option value="swing_trader">Multi-Day Trend Following (Swing Trader)</option>
              <option value="quant">Algorithmic & Statistical Confluence (Quant)</option>
              <option value="crypto">High Volatility Crypto Specialist</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Starting Paper Capital (USD)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[25000, 50000, 100000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setInitialBalance(amt)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    initialBalance === amt
                      ? "bg-indigo-950 border-indigo-700 text-indigo-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            {isSubmitting ? "Creating..." : "Initialize Persona & Switch"}
          </button>
        </form>
      </div>
    </div>
  );
};
