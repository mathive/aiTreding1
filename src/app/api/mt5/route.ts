import { NextResponse } from "next/server";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";

async function call(path: string, opts?: RequestInit) {
  try {
    const r = await fetch(B + path, { ...opts, headers: { "Content-Type": "application/json", ...opts?.headers } });
    const d = await r.json();
    return NextResponse.json(d, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: "Bridge offline. Start: cd mt5-bridge && python server.py" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const b = await req.json();
  if (b.action === "init") return call("/init", { method: "POST", body: JSON.stringify(b) });
  if (b.action === "shutdown") return call("/shutdown", { method: "POST" });
  if (b.action === "order") return call("/order", { method: "POST", body: JSON.stringify(b) });
  if (b.action === "ticks") return call("/ticks", { method: "POST", body: JSON.stringify({ symbols: b.symbols }) });
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
