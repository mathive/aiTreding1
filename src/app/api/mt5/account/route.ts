import { NextResponse } from "next/server";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";

async function call(path: string, opts?: RequestInit) {
  try {
    const r = await fetch(B + path, { ...opts, headers: { "Content-Type": "application/json", ...opts?.headers } });
    const d = await r.json();
    return NextResponse.json(d, { status: r.status });
  } catch (e: any) { return NextResponse.json({ error: "Bridge offline" }, { status: 503 }); }
}

export async function GET() { return call("/account"); }
export async function POST(req: Request) {
  const b = await req.json();
  return call("/init", { method: "POST", body: JSON.stringify({ login: Number(b.login), password: b.password, server: b.server || "VantageFX-Live") });
}