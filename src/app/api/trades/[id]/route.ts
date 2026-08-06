import { NextResponse } from "next/server";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id.startsWith("mt5_")) return NextResponse.json({ error: "Not an MT5 position" }, { status: 400 });
  const ticket = Number(id.slice(4));
  const body = await req.json();
  try {
    const r = await fetch(`${B}/position/${ticket}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sl: Number(body.stopLoss) || 0, tp: Number(body.takeProfit) || 0 }) });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch { return NextResponse.json({ error: "MT5 bridge offline" }, { status: 503 }); }
}
export async function DELETE() { return NextResponse.json({ success: true }); }
