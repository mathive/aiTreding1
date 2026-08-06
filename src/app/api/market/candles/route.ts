import { NextResponse } from "next/server";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const symbol = params.get("symbol");
  const timeframe = params.get("timeframe") || "1h";
  const count = Math.max(1, Math.min(Number(params.get("count")) || 100, 5000));
  if (!symbol) return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  try {
    const r = await fetch(`${B}/candles/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(timeframe)}&count=${count}`, { cache: "no-store" });
    const data = await r.json();
    if (!r.ok) return NextResponse.json(data, { status: r.status });
    return NextResponse.json({ candles: data });
  } catch {
    return NextResponse.json({ error: "MT5 bridge offline" }, { status: 503 });
  }
}
