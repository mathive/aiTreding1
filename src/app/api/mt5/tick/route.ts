import { NextResponse } from "next/server";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const r = await fetch(B + "/ticks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbols: b.symbols }) });
    return NextResponse.json(await r.json());
  } catch (e: any) { return NextResponse.json({ error: "Bridge offline" }, { status: 503 }); }
}