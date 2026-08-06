import { NextResponse } from "next/server";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";
export async function GET(request: Request) {
  try {
    const days = Math.max(1, Math.min(Number(new URL(request.url).searchParams.get("days")) || 7, 3650));
    const r = await fetch(B + `/history?days=${days}`, { headers: { "Content-Type": "application/json" }, cache: "no-store" });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e: any) { return NextResponse.json({ error: "Bridge offline" }, { status: 503 }); }
}
