import { NextResponse } from "next/server";
import { getLiveTickers } from "@/lib/market-data-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get("market"), search = searchParams.get("search");
    let assets = await getLiveTickers();
    if (market && market !== "all") assets = assets.filter(a => a.market === market);
    if (search) { const q = search.toLowerCase(); assets = assets.filter(a => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)); }
    return NextResponse.json({ assets, activeStrategiesCount: 0, timestamp: Date.now() });
  } catch (e: any) { return NextResponse.json({ assets: [], timestamp: Date.now() }); }
}
