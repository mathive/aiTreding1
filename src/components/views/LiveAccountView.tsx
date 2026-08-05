"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import {
  Key,
  Plus,
  Trash2,
  ShieldCheck,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  ToggleLeft,
  ToggleRight,
  Lock,
  Globe,
  X,
  Eye,
  EyeOff,
  Server,
  ArrowRightLeft,
} from "lucide-react";

interface ExchangeKeyItem {
  id: string;
  exchangeName: string;
  label: string;
  apiKey: string;
  apiSecret: string;
  passphrase: string | null;
  subAccount: string | null;
  permissions: string[];
  isTestnet: boolean;
  isActive: boolean;
  connectionStatus: string;
  lastPingMs: number | null;
  lastConnectedAt: string | null;
  lastError: string | null;
  ipWhitelist: string | null;
  totalTradesViaKey: number;
  totalVolume: string;
}

const EXCHANGES = [
  { id: "binance", name: "Binance", icon: "₿", color: "from-yellow-500 to-amber-600", desc: "Spot & USDT-M Futures" },
  { id: "bybit", name: "Bybit", icon: "BY", color: "from-orange-500 to-red-600", desc: "Linear & Inverse Perps" },
  { id: "coinbase", name: "Coinbase", icon: "CB", color: "from-blue-500 to-indigo-600", desc: "Advanced Trade API" },
  { id: "okx", name: "OKX", icon: "OK", color: "from-slate-500 to-slate-700", desc: "Unified Account API" },
  { id: "kraken", name: "Kraken", icon: "K", color: "from-purple-500 to-indigo-600", desc: "REST + WebSocket" },
  { id: "alpaca", name: "Alpaca", icon: "AL", color: "from-green-500 to-emerald-600", desc: "US Equities & Crypto" },
  { id: "interactive_brokers", name: "Interactive Brokers", icon: "IB", color: "from-red-600 to-rose-700", desc: "TWS Gateway API" },
  { id: "polygon", name: "Polygon.io", icon: "PG", color: "from-violet-500 to-purple-600", desc: "Market Data Feed" },
];

export const LiveAccountView: React.FC = () => {
  const { user, updateUserSettings, refreshAllData, showToast } = useApp();

  const [keys, setKeys] = useState<ExchangeKeyItem[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add key form
  const [selectedExchange, setSelectedExchange] = useState("binance");
  const [keyLabel, setKeyLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [isTestnet, setIsTestnet] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/exchange-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch { /* ignore */ }
    finally { setIsLoadingKeys(false); }
  };

  useEffect(() => { fetchKeys(); }, []);

  const isLiveMode = user?.tradingMode === "live";

  const handleModeSwitch = async (mode: "paper" | "live") => {
    if (mode === "live" && keys.filter((k) => k.isActive && k.connectionStatus === "connected").length === 0) {
      showToast("Add and verify an exchange API key before switching to LIVE mode", "error");
      return;
    }

    if (mode === "live") {
      const confirmed = confirm(
        "⚠️ LIVE TRADING MODE\n\nReal orders will be sent to your connected exchange(s).\nAll risk management limits remain enforced.\n\nAre you sure you want to enable LIVE execution?"
      );
      if (!confirmed) return;
    }

    setIsSwitching(true);
    try {
      const res = await fetch("/api/account/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        await refreshAllData();
      } else {
        showToast(data.error || "Failed to switch mode", "error");
      }
    } catch { showToast("Mode switch failed", "error"); }
    finally { setIsSwitching(false); }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !apiSecret) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/exchange-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchangeName: selectedExchange,
          label: keyLabel || `${EXCHANGES.find((x) => x.id === selectedExchange)?.name} Key`,
          apiKey,
          apiSecret,
          passphrase: passphrase || undefined,
          isTestnet,
          ipWhitelist: ipWhitelist || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        setShowAddModal(false);
        setApiKey(""); setApiSecret(""); setPassphrase(""); setKeyLabel(""); setIpWhitelist("");
        fetchKeys();
      } else {
        showToast(data.error || "Failed to add key", "error");
      }
    } catch { showToast("Failed to connect exchange", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const res = await fetch(`/api/exchange-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testConnection: true }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        fetchKeys();
      }
    } catch { showToast("Connection test failed", "error"); }
  };

  const handleToggleKey = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/exchange-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !active }),
      });
      fetchKeys();
    } catch { /* ignore */ }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Permanently delete this API key? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/exchange-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("API key deleted", "info");
        fetchKeys();
      }
    } catch { /* ignore */ }
  };

  const connectedCount = keys.filter((k) => k.connectionStatus === "connected" && k.isActive).length;
  const exchangeInfo = (name: string) => EXCHANGES.find((e) => e.id === name);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Mode Toggle */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 p-6 lg:p-8 shadow-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold text-white">Live Account & Exchange Hub</h1>
                <p className="text-xs text-slate-400">Connect exchange API keys, toggle Paper ↔ Live modes, manage execution routing</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>API keys are never shared and never leave this platform. All secrets are masked in the UI.</span>
            </div>
          </div>

          {/* Paper / Live Mode Master Toggle */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl">
              <button
                onClick={() => handleModeSwitch("paper")}
                disabled={isSwitching}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  !isLiveMode
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/80"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Paper Trading
              </button>

              <div className="text-center">
                <ArrowRightLeft className="w-4 h-4 text-slate-600 mx-auto" />
                <span className="text-[9px] text-slate-500 font-mono block mt-0.5">MODE</span>
              </div>

              <button
                onClick={() => handleModeSwitch("live")}
                disabled={isSwitching}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  isLiveMode
                    ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-950/80 ring-2 ring-rose-500/30"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <Zap className="w-4 h-4" />
                Live Trading
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className={`w-2.5 h-2.5 rounded-full ${isLiveMode ? "bg-rose-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
              <span className={`font-bold ${isLiveMode ? "text-rose-400" : "text-emerald-400"}`}>
                {isLiveMode ? "LIVE MODE — Real Orders Active" : "PAPER MODE — Simulated Orders"}
              </span>
              <span className="text-slate-500 font-mono">• {connectedCount} exchange(s) connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">Connected Exchanges</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-mono font-bold text-white">{connectedCount}</span>
          <p className="text-[10px] text-slate-500 mt-1">{keys.length} total key(s) configured</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">Execution Mode</span>
            <Zap className={`w-4 h-4 ${isLiveMode ? "text-rose-400" : "text-emerald-400"}`} />
          </div>
          <span className={`text-2xl font-bold ${isLiveMode ? "text-rose-400" : "text-emerald-400"}`}>
            {isLiveMode ? "LIVE" : "PAPER"}
          </span>
          <p className="text-[10px] text-slate-500 mt-1">
            {isLiveMode ? "Real orders routed to exchanges" : "All trades are simulated"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">Paper Balance</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-mono font-bold text-cyan-400">{formatCurrency(user?.balance)}</span>
          <p className="text-[10px] text-slate-500 mt-1">Simulated trading capital</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">Risk Guardrail</span>
            <Lock className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-2xl font-mono font-bold text-white">${user?.maxDailyLoss || "2500"}/day</span>
          <p className="text-[10px] text-slate-500 mt-1">Max daily loss circuit breaker</p>
        </div>
      </div>

      {/* Exchange Keys Table */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Exchange API Key Vault</h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-950/60 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Exchange Key
          </button>
        </div>

        {isLoadingKeys ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading exchange connections...</div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Key className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No exchange API keys configured</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Connect your exchange to enable live trading, real-time price feeds, and automated order routing.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Add Your First Exchange
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {keys.map((key) => {
              const exInfo = exchangeInfo(key.exchangeName);
              const isConnected = key.connectionStatus === "connected";
              return (
                <div key={key.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-850/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${exInfo?.color || "from-slate-500 to-slate-700"} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                      {exInfo?.icon || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{key.label}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isConnected
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}>
                          {isConnected ? "CONNECTED" : key.connectionStatus.toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          key.isTestnet ? "bg-amber-950 text-amber-400" : "bg-rose-950 text-rose-300"
                        }`}>
                          {key.isTestnet ? "TESTNET" : "MAINNET"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                        <span>Key: {key.apiKey}</span>
                        {key.lastPingMs && <span>• Ping: {key.lastPingMs}ms</span>}
                        {exInfo && <span className="font-sans">• {exInfo.desc}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTestConnection(key.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Test
                    </button>
                    <button
                      onClick={() => handleToggleKey(key.id, key.isActive)}
                      className="p-1.5 cursor-pointer"
                      title={key.isActive ? "Disable" : "Enable"}
                    >
                      {key.isActive ? (
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Supported Exchanges Grid */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          Supported Exchange Integrations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {EXCHANGES.map((ex) => {
            const hasKey = keys.some((k) => k.exchangeName === ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => { setSelectedExchange(ex.id); setShowAddModal(true); }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-1 ${
                  hasKey
                    ? "bg-cyan-950/40 border-cyan-800/70 shadow-md"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ex.color} flex items-center justify-center text-white font-bold text-[10px] shadow-sm`}>
                    {ex.icon}
                  </div>
                  {hasKey && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-xs font-bold text-white">{ex.name}</p>
                <p className="text-[10px] text-slate-500">{ex.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Exchange Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${exchangeInfo(selectedExchange)?.color} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                  {exchangeInfo(selectedExchange)?.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Connect {exchangeInfo(selectedExchange)?.name}</h3>
                  <p className="text-xs text-slate-400">Enter your API credentials securely</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddKey} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Exchange</label>
                <select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {EXCHANGES.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} — {e.desc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Label (Optional)</label>
                <input
                  type="text"
                  value={keyLabel}
                  onChange={(e) => setKeyLabel(e.target.value)}
                  placeholder="e.g. My Binance Futures Account"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">API Secret</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Paste your API secret..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-xs font-mono text-rose-300 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-2 text-slate-500 hover:text-white cursor-pointer"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {(selectedExchange === "coinbase" || selectedExchange === "okx") && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Exchange passphrase..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Network Type */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="testnet"
                    name="netType"
                    checked={isTestnet}
                    onChange={() => setIsTestnet(true)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="testnet" className="text-xs text-slate-300 cursor-pointer">
                    <span className="font-bold text-emerald-400">Testnet</span> (Paper / Sandbox)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="mainnet"
                    name="netType"
                    checked={!isTestnet}
                    onChange={() => setIsTestnet(false)}
                    className="w-4 h-4 accent-rose-500 cursor-pointer"
                  />
                  <label htmlFor="mainnet" className="text-xs text-slate-300 cursor-pointer">
                    <span className="font-bold text-rose-400">Mainnet</span> (Live / Real Funds)
                  </label>
                </div>
              </div>

              {!isTestnet && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Warning:</strong> Mainnet keys will route real money orders. Ensure you have IP whitelist and 2FA enabled on your exchange account.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">IP Whitelist (Optional)</label>
                <input
                  type="text"
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  placeholder="e.g. 203.0.113.0/24"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-cyan-950/60 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                {isSubmitting ? "Testing Connection..." : "Connect & Verify Exchange"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
