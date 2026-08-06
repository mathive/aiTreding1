import { NextResponse } from "next/server";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ticket = id.startsWith("mt5_") ? parseInt(id.replace("mt5_", ""), 10) : null;
    if (!ticket) return NextResponse.json({ success: true, message: "Closed" });
    const r = await fetch(B+"/close/"+ticket, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ticket}) });
    return NextResponse.json(await r.json());
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
