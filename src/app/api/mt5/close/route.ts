import { NextResponse } from "next/server";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const r = await fetch(B + "/close/" + b.ticket, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e: any) { return NextResponse.json({ error: "Bridge offline" }, { status: 503 }); }
}