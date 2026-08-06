"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import {
  Key, Plus, Trash2, ShieldCheck, Zap, RefreshCw,
  CheckCircle2, AlertCircle, Wifi, ToggleLeft, ToggleRight,
  Lock, Globe, X, Eye, EyeOff, ArrowRightLeft, Server, Terminal,
} from "lucide-react";

interface ExchangeKeyItem {
  id: string; exchangeName: string; label: string;
  apiKey: string; apiSecret: string; passphrase: string | null;
  subAccount: string | null; permissions: string[]; isTestnet: boolean;
  isActive: boolean; connectionStatus: string; lastPingMs: number | null;
  lastConnectedAt: string | null; lastError: string | null;
  ipWhitelist: string | null; totalTradesViaKey: number; totalVolume: string;
}

interface Mt5Account {
  login?: number; name?: string; server?: string;
  balance?: number; equity?: number; margin?: number;
  free_margin?: number; leverage?: number; currency?: string;
  profit?: number;
}

const EXCHANGES = [
  { id: "vantage_mt5", name: "Vantage Markets", icon: "VA", color: "from-red-600 to-rose-700", desc: "MT5 Bridge — Forex, Indices, Commodities" },
  { id: "binance", name: "Binance", icon: "₿", color: "from-yellow-500 to-amber-600", desc: "Spot & USDT-M Futures" },
  { id: "coinbase", name: "Coinbase", icon: "CB", color: "from-blue-500 to-indigo-600", desc: "Advanced Trade API" },
  { id: "okx", name: "OKX", icon: "OK", color: "from-slate-500 to-slate-700", desc: "Unified Account API" },
  { id: "alpaca", name: "Alpaca", icon: "AL", color: "from-green-500 to-emerald-600", desc: "US Equities & Crypto" },
];

export const LiveAccountView: React.FC = () => {
  const { user, updateUserSettings, refreshAllData, showToast, mt5Connected, setMt5Connected } = useApp();

  // MT5 state
  const [mt5Login, setMt5Login] = useState("");
  const [mt5Password, setMt5Password] = useState("");
  const [mt5Server, setMt5Server] = useState("VantageFX-Live");
  // mt5Connected now comes from AppContext globally
  const [mt5Connecting, setMt5Connecting] = useState(false);
  const [mt5Account, setMt5Account] = useState<Mt5Account | null>(null);
  const [mt5Error, setMt5Error] = useState("");
  const [storedAccounts, setStoredAccounts] = useState<any[]>([]);
  const [selectedStored, setSelectedStored] = useState<number | null>(null);

  const [keys, setKeys] = useState<ExchangeKeyItem[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
    } catch {}
    finally { setIsLoadingKeys(false); }
  };

  useEffect(() => { fetchKeys(); fetchStoredAccounts(); }, []);

  const fetchStoredAccounts = async () => {
    try {
      const r = await fetch("/api/mt5/accounts");
      if (r.ok) { const d = await r.json(); setStoredAccounts(d); }
    } catch {}
  };

  // ──── MT5 Connection ────
  const handleMt5Connect = async () => {
    if (!mt5Login || !mt5Password) return;
    setMt5Connecting(true); setMt5Error("");
    try {
      const res = await fetch("/api/mt5/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: Number(mt5Login), password: mt5Password, server: mt5Server }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMt5Connected(true);
        setMt5Account(data.account);
        fetchStoredAccounts();
        showToast(`Connected to Vantage MT5 — ${data.account.name}`, "success");
      } else {
        setMt5Error(data.error || "Connection failed. Make sure MT5 is running and the bridge server is started.");
      }
    } catch (e: any) {
      setMt5Error(e.message || "MT5 Bridge unreachable. Run: cd mt5-bridge && python server.py");
    }
    finally { setMt5Connecting(false); }
  };

  const handleMt5Disconnect = async () => {
    try {
      await fetch("/api/mt5", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "shutdown" }) });
    } catch {}
    setMt5Connected(false); setMt5Account(null);
  };

  const isLiveMode = user?.tradingMode === "live";
  const connectedCount = keys.filter((k) => k.connectionStatus === "connected" && k.isActive).length + (mt5Connected ? 1 : 0);

  const handleModeSwitch = async (mode: "paper" | "live") => {
    if (mode === "live" && connectedCount === 0) {
      showToast("Connect an exchange or MT5 before switching to LIVE mode", "error"); return;
    }
    if (mode === "live" && !confirm("⚠️ LIVE TRADING MODE\n\nReal orders will be sent to your connected exchange(s).\nAll risk management limits remain enforced.\n\nAre you sure?")) return;
    setIsSwitching(true);
    try {
      const res = await fetch("/api/account/mode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
      const data = await res.json();
      if (res.ok) { showToast(data.message, "success"); await refreshAllData(); }
      else showToast(data.error || "Failed to switch mode", "error");
    } catch { showToast("Mode switch failed", "error"); }
    finally { setIsSwitching(false); }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !apiSecret) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/exchange-keys", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchangeName: selectedExchange, label: keyLabel || selectedExchange, apiKey, apiSecret, passphrase: passphrase || undefined, isTestnet, ipWhitelist: ipWhitelist || undefined }),
      });
      const data = await res.json();
      if (res.ok) { showToast(data.message, "success"); setShowAddModal(false); setApiKey(""); setApiSecret(""); setPassphrase(""); setKeyLabel(""); setIpWhitelist(""); fetchKeys(); }
      else showToast(data.error || "Failed", "error");
    } catch { showToast("Failed to connect", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const res = await fetch(`/api/exchange-keys/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ testConnection: true }) });
      const data = await res.json();
      if (res.ok) { showToast(data.message, "success"); fetchKeys(); }
    } catch { showToast("Connection test failed", "error"); }
  };

  const handleToggleKey = async (id: string, active: boolean) => {
    try { await fetch(`/api/exchange-keys/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !active }) }); fetchKeys(); } catch {}
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Permanently delete this API key?")) return;
    try { const res = await fetch(`/api/exchange-keys/${id}`, { method: "DELETE" }); if (res.ok) { showToast("API key deleted", "info"); fetchKeys(); } } catch {}
  };

  const exchangeInfo = (name: string) => EXCHANGES.find((e) => e.id === name);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 p-6 lg:p-8 shadow-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400"><Key className="w-6 h-6" /></div>
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold text-white">Live Account & Exchange Hub</h1>
                <p className="text-xs text-slate-400">Connect Vantage MT5 or exchange APIs • Paper ↔ Live mode</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl">
              <button onClick={() => handleModeSwitch("paper")} disabled={isSwitching}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 ${!isLiveMode ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/80" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"}`}>
                <ShieldCheck className="w-4 h-4" />Paper Trading</button>
              <div className="text-center"><ArrowRightLeft className="w-4 h-4 text-slate-600 mx-auto" /><span className="text-[9px] text-slate-500 font-mono block mt-0.5">MODE</span></div>
              <button onClick={() => handleModeSwitch("live")} disabled={isSwitching}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 ${isLiveMode ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-950/80 ring-2 ring-rose-500/30" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"}`}>
                <Zap className="w-4 h-4" />Live Trading</button>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className={`w-2.5 h-2.5 rounded-full ${isLiveMode ? "bg-rose-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
              <span className={`font-bold ${isLiveMode ? "text-rose-400" : "text-emerald-400"}`}>{isLiveMode ? "LIVE MODE" : "PAPER MODE"}</span>
              <span className="text-slate-500 font-mono">• {connectedCount} connection(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2"><span className="text-[11px] font-bold uppercase text-slate-400">Connections</span><Wifi className="w-4 h-4 text-emerald-400" /></div>
          <span className="text-2xl font-mono font-bold text-white">{connectedCount}</span>
          <p className="text-[10px] text-slate-500 mt-1">MT5 + {keys.length} API keys</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2"><span className="text-[11px] font-bold uppercase text-slate-400">Mode</span><Zap className={`w-4 h-4 ${isLiveMode ? "text-rose-400" : "text-emerald-400"}`} /></div>
          <span className={`text-2xl font-bold ${isLiveMode ? "text-rose-400" : "text-emerald-400"}`}>{isLiveMode ? "LIVE" : "PAPER"}</span>
          <p className="text-[10px] text-slate-500 mt-1">{isLiveMode ? "Real orders" : "Simulated orders"}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2"><span className="text-[11px] font-bold uppercase text-slate-400">Balance</span><ShieldCheck className="w-4 h-4 text-cyan-400" /></div>
          <span className="text-2xl font-mono font-bold text-cyan-400">{formatCurrency(user?.balance)}</span>
          <p className="text-[10px] text-slate-500 mt-1">{mt5Connected ? `MT5: $${mt5Account?.balance?.toLocaleString() ?? "..."}` : "Paper capital"}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2"><span className="text-[11px] font-bold uppercase text-slate-400">Risk Limit</span><Lock className="w-4 h-4 text-indigo-400" /></div>
          <span className="text-2xl font-mono font-bold text-white">${user?.maxDailyLoss || "2500"}/day</span>
          <p className="text-[10px] text-slate-500 mt-1">Circuit breaker</p>
        </div>
      </div>

      {/* ──── VANTAGE MT5 CONNECTION PANEL ──── */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-red-950/30 to-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-bold text-xs shadow-lg">VA</div>
            <div>
              <h2 className="text-base font-bold text-white">Vantage Markets — MetaTrader 5 Bridge</h2>
              <p className="text-[11px] text-slate-400">Connect directly to your Vantage MT5 account via the Python bridge</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${mt5Connected ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-slate-800 text-slate-400"}`}>
            {mt5Connected ? "🟢 CONNECTED" : "⚫ DISCONNECTED"}
          </span>
        </div>

        <div className="p-6 space-y-4">
          {!mt5Connected ? (
            <>
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Before connecting:</strong><br />
                  1. Open MetaTrader 5 and log into your Vantage account<br />
                  2. Start the bridge: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[11px]">cd mt5-bridge &amp;&amp; pip install -r requirements.txt &amp;&amp; python server.py</code><br />
                  3. Enter your MT5 credentials below and click Connect
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">MT5 Login (Account #)</label>
                  <input type="number" value={mt5Login} onChange={(e) => setMt5Login(e.target.value)}
                    placeholder="e.g. 51234567" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">MT5 Password</label>
                  <input type="password" value={mt5Password} onChange={(e) => setMt5Password(e.target.value)}
                    placeholder="MT5 password" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Server</label>
                  <select value={mt5Server} onChange={(e) => setMt5Server(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer">
                    <option value="VantageFX-Live">VantageFX-Live</option>
                    <option value="VantageFX-Demo">VantageFX-Demo</option>
                    <option value="VantageMarkets-Live">VantageMarkets-Live</option>
                    <option value="VantageMarkets-Demo">VantageMarkets-Demo</option>
                  </select>
                </div>
              </div>
              {storedAccounts.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Previously Connected Accounts — click to auto-fill</label>
                  <div className="flex flex-wrap gap-2">
                    {storedAccounts.map((a: any) => (
                      <button key={a.login} type="button" onClick={() => { setMt5Login(String(a.login)); setMt5Server(a.server); setMt5Password(""); setSelectedStored(a.login); }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border cursor-pointer transition-all ${selectedStored === a.login ? "bg-red-950/60 border-red-700 text-red-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white"}`}>
                        <span className="font-bold">#{a.login}</span>
                        <span className="mx-1.5 text-slate-600">|</span>
                        <span>{a.name || a.server}</span>
                        {a.last_connected && <span className="ml-1.5 text-[9px] text-slate-600">{new Date(a.last_connected).toLocaleDateString()}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mt5Error && <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2"><AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" /><span>{mt5Error}</span></div>}
              <button onClick={handleMt5Connect} disabled={mt5Connecting}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-950/60 cursor-pointer disabled:opacity-50">
                <Server className="w-4 h-4" />{mt5Connecting ? "Connecting..." : "Connect to Vantage MT5"}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              {/* MT5 Account Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500 font-bold">Account</div><div className="text-sm font-mono font-bold text-white mt-0.5">#{mt5Account?.login}</div></div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500 font-bold">Balance</div><div className="text-sm font-mono font-bold text-white mt-0.5">${mt5Account?.balance?.toLocaleString() ?? "--"}</div></div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500 font-bold">Equity</div><div className="text-sm font-mono font-bold text-white mt-0.5">${mt5Account?.equity?.toLocaleString() ?? "--"}</div></div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500 font-bold">Free Margin</div><div className="text-sm font-mono font-bold text-white mt-0.5">${mt5Account?.free_margin?.toLocaleString() ?? "--"}</div></div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500 font-bold">Leverage</div><div className="text-sm font-mono font-bold text-white mt-0.5">{mt5Account?.leverage || "--"}:1</div></div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500 font-bold">Server</div><div className="text-sm font-mono font-bold text-white mt-0.5">{mt5Account?.server || "--"}</div></div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500 font-bold">Currency</div><div className="text-sm font-mono font-bold text-white mt-0.5">{mt5Account?.currency || "--"}</div></div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500 font-bold">Profit</div><div className={`text-sm font-mono font-bold mt-0.5 ${Number(mt5Account?.profit) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>${mt5Account?.profit?.toLocaleString() ?? "--"}</div></div>
              </div>
              <button onClick={handleMt5Disconnect}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer">
                Disconnect MT5
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exchange Keys Table */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2"><Key className="w-4 h-4 text-cyan-400" /><h2 className="text-base font-bold text-white">Exchange API Key Vault</h2></div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-950/60 cursor-pointer"><Plus className="w-4 h-4" />Add Key</button>
        </div>
        {isLoadingKeys ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Key className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No API keys configured</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">Add exchange API keys for additional market access and order routing.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {keys.map((key) => {
              const exInfo = exchangeInfo(key.exchangeName);
              const isConnected = key.connectionStatus === "connected";
              return (
                <div key={key.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-850/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${exInfo?.color || "from-slate-500 to-slate-700"} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>{exInfo?.icon || "?"}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{key.label}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isConnected ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"}`}>{isConnected ? "CONNECTED" : key.connectionStatus.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                        <span>Key: {key.apiKey}</span>
                        {key.lastPingMs && <span>• {key.lastPingMs}ms</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleTestConnection(key.id)} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 cursor-pointer flex items-center gap-1.5"><RefreshCw className="w-3 h-3" />Test</button>
                    <button onClick={() => handleToggleKey(key.id, key.isActive)} className="p-1.5 cursor-pointer">{key.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}</button>
                    <button onClick={() => handleDeleteKey(key.id)} className="p-1.5 text-slate-600 hover:text-rose-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Supported Exchanges Grid */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" />Supported Integrations</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {EXCHANGES.map((ex) => {
            const hasKey = keys.some((k) => k.exchangeName === ex.id);
            return (
              <button key={ex.id} onClick={() => { setSelectedExchange(ex.id); setShowAddModal(true); }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-1 ${hasKey ? "bg-cyan-950/40 border-cyan-800/70 shadow-md" : "bg-slate-950/60 border-slate-800 hover:border-slate-700"}`}>
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ex.color} flex items-center justify-center text-white font-bold text-[10px] shadow-sm`}>{ex.icon}</div>
                  {hasKey && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-xs font-bold text-white">{ex.name}</p>
                <p className="text-[10px] text-slate-500">{ex.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div><h3 className="text-sm font-bold text-white">Connect {exchangeInfo(selectedExchange)?.name}</h3></div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddKey} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Exchange</label>
                <select value={selectedExchange} onChange={(e) => setSelectedExchange(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white cursor-pointer">
                  {EXCHANGES.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.desc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Label</label>
                <input type="text" value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} placeholder="e.g. My Account" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">API Key</label>
                <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API key..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300" required />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">API Secret</label>
                <div className="relative">
                  <input type={showSecret ? "text" : "password"} value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder="API secret..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-xs font-mono text-rose-300" required />
                  <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-2 text-slate-500 hover:text-white cursor-pointer">{showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={isTestnet} onChange={() => setIsTestnet(true)} className="accent-emerald-500" /><span className="text-xs text-emerald-400 font-bold">Testnet</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={!isTestnet} onChange={() => setIsTestnet(false)} className="accent-rose-500" /><span className="text-xs text-rose-400 font-bold">Mainnet</span></label>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl font-bold text-xs uppercase text-white shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                <Wifi className="w-4 h-4" />{isSubmitting ? "Connecting..." : "Add Key"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
