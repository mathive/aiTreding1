"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Server, AlertCircle, KeyRound, TrendingUp, WifiOff } from "lucide-react";

interface Props { onConnected: () => void; }

export const ConnectionGate: React.FC<Props> = ({ onConnected }) => {
  const [login, setLogin] = useState("");
  const [pwd, setPwd] = useState("");
  const [server, setServer] = useState("VantageFX-Live");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "connecting" | "done">("idle");
  const [stored, setStored] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/mt5/accounts").then(r=>r.json()).then(d=>Array.isArray(d)&&setStored(d)).catch(()=>{});
  }, []);

  const connect = async () => {
    if (!login || !pwd) { setError("Enter MT5 login and password."); return; }
    setConnecting(true); setError(""); setStep("connecting");
    try {
      const r = await fetch("/api/mt5/account", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: Number(login), password: pwd, server }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) { setStep("idle"); setError(d.error||"Connection failed."); setConnecting(false); return; }
      // Bootstrap
      try { await fetch("/api/bootstrap", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ mt5Login:login, mt5Server:server, accountName:d.account?.name, accountBalance:d.account?.balance }) }); } catch {}
      setStep("done");
      setTimeout(()=>onConnected(), 500);
    } catch { setStep("idle"); setError("Bridge unreachable. Run: cd mt5-bridge && python server.py"); }
    finally { setConnecting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/40 border border-red-800/50 text-red-400 text-[11px] font-bold uppercase tracking-widest"><TrendingUp className="w-4 h-4"/> Vantage Markets</div>
          <h1 className="text-3xl font-extrabold text-white">Nexus Trading Terminal</h1>
          <p className="text-sm text-slate-400">Connect Vantage MT5 to unlock live trading.</p>
        </div>
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-300/80 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/>
              <div><strong>Before connecting:</strong><br/>1. Open MT5, log into Vantage<br/>2. Start bridge: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[11px] text-amber-200">cd mt5-bridge &amp;&amp; python server.py</code></div>
            </div>
            {stored.length>0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Saved Accounts</label>
                <div className="grid grid-cols-2 gap-2">
                  {stored.map((a:any)=>(<button key={a.login} onClick={()=>{setLogin(String(a.login));setServer(a.server);setError("");}} className={`p-2.5 rounded-xl text-left border cursor-pointer ${String(a.login)===login?"bg-red-950/40 border-red-700 text-red-200":"bg-slate-950 border-slate-800 text-slate-400 hover:text-white"}`}><div className="text-xs font-mono font-bold">#{a.login}</div><div className="text-[10px] text-slate-500 truncate">{a.server}</div></button>))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <div><label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">MT5 Account #</label><input type="number" value={login} onChange={e=>{setLogin(e.target.value);setError("");}} disabled={connecting} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-red-500 disabled:opacity-50"/></div>
              <div><label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">Password</label><input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setError("");}} disabled={connecting} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-red-500 disabled:opacity-50"/></div>
              <div><label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">Server</label><select value={server} onChange={e=>setServer(e.target.value)} disabled={connecting} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white cursor-pointer"><option>VantageFX-Live</option><option>VantageFX-Demo</option><option>VantageMarkets-Live</option><option>VantageMarkets-Demo</option></select></div>
            </div>
            {error&&<div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2"><AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"/><span>{error}</span></div>}
            <button onClick={connect} disabled={connecting} className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:from-red-900 rounded-xl font-bold text-sm uppercase text-white shadow-xl cursor-pointer flex items-center justify-center gap-2.5">
              {step==="connecting"?<><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>Connecting...</>:step==="done"?<><ShieldCheck className="w-5 h-5 text-emerald-400"/>Connected — Loading...</>:<><Server className="w-5 h-5"/>Connect to Vantage MT5</>}
            </button>
          </div>
          <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60"><div className="flex items-center justify-between text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><KeyRound className="w-3 h-3"/>Credentials local only</span><span className="flex items-center gap-1.5"><WifiOff className="w-3 h-3"/>Offline until connected</span></div></div>
        </div>
      </div>
    </div>
  );
};
