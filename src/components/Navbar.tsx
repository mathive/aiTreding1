"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  Bot,
  Zap,
  Bell,
  Volume2,
  VolumeX,
  ChevronDown,
  User,
  Plus,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Check,
  X,
  Sparkles,
  Wallet,
} from "lucide-react";

interface NavbarProps {
  onOpenNewTraderModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewTraderModal }) => {
  const {
    user,
    availableUsers,
    switchUser,
    updateUserSettings,
    setIsDepositModalOpen,
    marketAssets,
    notifications,
    unreadNotifsCount,
    markAllNotificationsRead,
    deleteNotification,
    runScanAndTrade,
    isScanning,
    botConfig,
    setActiveTab,
    setSelectedSymbol,
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSoundToggle = () => {
    if (user) {
      updateUserSettings({ soundEffects: !user.soundEffects });
    }
  };

  const topTickers = marketAssets.slice(0, 5);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Brand & Live Market Pill */}
      <div className="flex items-center gap-6">
        <div
          onClick={() => setActiveTab("overview")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">NEXUS</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold bg-gradient-to-r from-cyan-500 to-indigo-500 text-white tracking-wide">
                AI TRADER
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">AUTONOMOUS MULTI-STRATEGY</p>
          </div>
        </div>

        {/* Live Top Tickers Ribbon (Hidden on very small screens) */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 mr-2 border-r border-slate-800 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE MARKETS
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            {topTickers.map((asset) => {
              const isPositive = asset.change24h >= 0;
              return (
                <button
                  key={asset.symbol}
                  onClick={() => {
                    setSelectedSymbol(asset.symbol);
                    setActiveTab("terminal");
                  }}
                  className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors cursor-pointer group/item"
                >
                  <span className="font-semibold text-slate-300 group-hover/item:text-white">
                    {asset.symbol.split("/")[0]}
                  </span>
                  <span className="text-slate-400">
                    ${asset.currentPrice < 10 ? asset.currentPrice.toFixed(2) : asset.currentPrice.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-medium ${
                      isPositive ? "text-emerald-400 bg-emerald-950/60" : "text-rose-400 bg-rose-950/60"
                    }`}
                  >
                    {formatPercent(asset.change24h)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Quick Bot Trigger, Balance, Trader Switcher, Notifications */}
      <div className="flex items-center gap-3">
        {/* Live MT5 Badge */}
        <button onClick={() => setActiveTab("liveaccount")}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer bg-rose-950/80 border-rose-800 text-rose-400 hover:bg-rose-900/80 ring-1 ring-rose-500/20">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />LIVE MT5</button>

        {/* Fast AI Scanner Trigger Button */}
        <button
          onClick={() => runScanAndTrade(true)}
          disabled={isScanning}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-medium text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          title="Force Nexus AI to scan all markets and execute high-confluence trades immediately"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-cyan-200" : "text-yellow-300"}`} />
          <span className="hidden sm:inline">
            {isScanning ? "Scanning Markets..." : "AI Scan & Execute"}
          </span>
          <span className="sm:hidden">{isScanning ? "..." : "AI Scan"}</span>
        </button>

        {/* MT5 Account */}
        <button onClick={() => setActiveTab("liveaccount")}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer text-left group">
          <Zap className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:block text-xs font-mono font-bold text-rose-400">Vantage MT5</span>
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={handleSoundToggle}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={user?.soundEffects ? "Sound effects enabled" : "Sound effects muted"}
        >
          {user?.soundEffects ? (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Notifications Center Dropdown */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-slate-950 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-950 animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Alerts & Trade Logs
                  </span>
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 transition-colors flex items-start gap-2.5 ${
                        !n.isRead ? "bg-cyan-950/20" : "hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-cyan-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="text-slate-600 hover:text-slate-400 p-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Trader Profile Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-cyan-500/50"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-xs">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                <span>{user?.name || "Trader"}</span>
                <span className="text-[9px] font-normal px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 uppercase">
                  {user?.traderType?.replace("_", " ") || "PRO"}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-800 mb-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Trader Persona
                </p>
                <p className="text-xs font-bold text-white mt-0.5">{user?.name}</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-500 uppercase px-2 pt-1">
                  Switch Trader Account
                </p>
                {availableUsers.map((u) => {
                  const isCurrent = u.id === user?.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-semibold"
                          : "hover:bg-slate-800/70 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-lg object-cover" />
                        <div className="text-left">
                          <p className="text-xs font-medium text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">
                            {u.traderType.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onOpenNewTraderModal();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-indigo-400 hover:bg-indigo-950/40 hover:text-indigo-300 font-medium transition-colors cursor-pointer border border-dashed border-indigo-800/60 mt-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Custom Trader Persona</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
