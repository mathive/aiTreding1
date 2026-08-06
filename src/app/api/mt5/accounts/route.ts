import { NextResponse } from "next/server";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";
export async function GET() {
  try {
    const r = await fetch(B + "/accounts", { headers: { "Content-Type": "application/json" } });
    return NextResponse.json(await r.json());
  } catch { return NextResponse.json([]); }
}