"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { X, Wallet, RotateCcw, PlusCircle, Check } from "lucide-react";

export const DepositResetModal: React.FC = () => {
  const { isDepositModalOpen, setIsDepositModalOpen, user, resetBalance, updateUserSettings } = useApp();
  const [customAmount, setCustomAmount] = useState<number>(10000);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  if (!isDepositModalOpen) return null;

  const handleReset = async () => {
    setIsUpdating(true);
    await resetBalance();
    setIsUpdating(false);
    setIsDepositModalOpen(false);
  };

  const handleAddFunds = async (amountToAdd: number) => {
    setIsUpdating(true);
    const cur = parseFloat(user?.balance || "50000");
    await updateUserSettings({ balance: (cur + amountToAdd).toString() });
    setIsUpdating(false);
    setIsDepositModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Paper Trading Balance</h3>
              <p className="text-xs text-slate-400">Current: {formatCurrency(user?.balance)}</p>
            </div>
          </div>
          <button
            onClick={() => setIsDepositModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Available Liquidity</p>
            <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
              {formatCurrency(user?.balance)}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Initial Starting: {formatCurrency(user?.initialBalance)}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-300">Quick Simulated Deposit:</p>
            <div className="grid grid-cols-3 gap-2">
              {[5000, 10000, 25000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAddFunds(amt)}
                  disabled={isUpdating}
                  className="py-2 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-700/60 rounded-xl text-xs font-mono font-bold text-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  +{formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              disabled={isUpdating}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              Reset Balance to Initial ({formatCurrency(user?.initialBalance)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
