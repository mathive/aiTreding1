import { NextResponse } from "next/server";
const B = process.env.MT5_BRIDGE_URL || "http://localhost:8000";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ticket = id.startsWith("mt5_") ? parseInt(id.replace("mt5_", ""), 10) : null;
    if (!ticket) return NextResponse.json({ success: true, message: "Closed" });
    const body = await req.json().catch(() => ({}));
    let volume: number | undefined;
    if (body.closePercent && Number(body.closePercent) < 100) {
      const positions = await fetch(B + "/positions");
      const all = positions.ok ? await positions.json() : [];
      const position = Array.isArray(all) ? all.find((p: any) => p.ticket === ticket) : null;
      if (!position) return NextResponse.json({ error: "Position not found" }, { status: 404 });
      volume = Number(position.volume) * Number(body.closePercent) / 100;
    }
    const r = await fetch(B+"/close/"+ticket, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ volume }) });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
