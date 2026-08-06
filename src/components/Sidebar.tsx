"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard,
  Bot,
  Radar,
  LineChart,
  Layers,
  History,
  FlaskConical,
  MessageSquareCode,
  Settings,
  ShieldCheck,
  Zap,
  TrendingUp,
  Key,
  Activity,
  BellRing,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openTrades,
    strategies,
    botConfig,
    user,
    setSelectedSymbol,
  } = useApp();

  const activeStrategiesCount = strategies.filter((s) => s.isActive).length;

  const navItems = [
    {
      id: "overview",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "bot",
      label: "Autonomous AI Bot",
      icon: Bot,
      badge: botConfig?.isActive && user?.autoTradingEnabled ? "LIVE" : "PAUSED",
      badgeColor:
        botConfig?.isActive && user?.autoTradingEnabled
          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
          : "bg-amber-950 text-amber-400 border-amber-800",
    },
    {
      id: "pricescan",
      label: "Live Price Scanner",
      icon: Activity,
      badge: "REAL-TIME",
      badgeColor: "bg-emerald-950 text-emerald-400 border-emerald-800",
    },
    {
      id: "scanner",
      label: "Market Scanner",
      icon: Radar,
      badge: "20 ASSETS",
      badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    },
    {
      id: "terminal",
      label: "Trading Terminal",
      icon: LineChart,
      badge: null,
    },
    {
      id: "strategies",
      label: "Strategy Hub",
      icon: Layers,
      badge: `${activeStrategiesCount} ACTIVE`,
      badgeColor: "bg-cyan-950 text-cyan-400 border-cyan-800",
    },
    {
      id: "positions",
      label: "Positions & Logs",
      icon: History,
      badge: openTrades.length > 0 ? `${openTrades.length} OPEN` : null,
      badgeColor: "bg-indigo-950 text-indigo-400 border-indigo-800",
    },
    {
      id: "backtest",
      label: "Backtesting Lab",
      icon: FlaskConical,
      badge: null,
    },
    {
      id: "copilot",
      label: "AI Copilot & Builder",
      icon: MessageSquareCode,
      badge: "AI 4.0",
      badgeColor: "bg-purple-950 text-purple-300 border-purple-800",
    },
    {
      id: "liveaccount",
      label: "Live Account & Keys",
      icon: Key,
      badge: user?.tradingMode === "live" ? "LIVE" : "PAPER",
      badgeColor: user?.tradingMode === "live"
        ? "bg-rose-950 text-rose-400 border-rose-800"
        : "bg-emerald-950 text-emerald-400 border-emerald-800",
    },
    {
      id: "settings",
      label: "Risk & Settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 h-full min-h-0 border-r border-slate-800/80 bg-slate-950 flex flex-col justify-between shrink-0 select-none overflow-y-auto overscroll-contain">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Trading Systems
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer group ${
                isActive
                  ? "bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 text-cyan-300 border border-cyan-800/60 shadow-lg shadow-cyan-950/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-semibold border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bot Status & Risk Guard Widget in Sidebar Footer */}
      <div className="p-3 m-3 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                botConfig?.isActive && user?.autoTradingEnabled
                  ? "bg-emerald-400 animate-ping"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-[11px] font-bold text-white tracking-wide">
              {botConfig?.isActive && user?.autoTradingEnabled ? "AI Execution Engine" : "AI Alerts Only"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-semibold">
            {botConfig?.confluenceThreshold || 75}% Min
          </span>
        </div>

        <div className="text-[10px] text-slate-400 leading-relaxed">
          {botConfig?.isActive && user?.autoTradingEnabled
            ? `Autonomously scanning 20 selected markets. Threshold: ≥${botConfig?.confluenceThreshold}% confluence.`
            : `Auto-trading is paused. Trades require manual one-click approval.`}
        </div>

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            Max DD Guard
          </span>
          <span className="text-white font-semibold">
            ${user?.maxDailyLoss || "2500"}/day
          </span>
        </div>
      </div>
    </aside>
  );
};
