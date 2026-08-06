import { NextResponse } from "next/server";
import { db } from "@/db";
import { priceAlerts } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getLiveTickers } from "@/lib/market-data-service";

export async function GET() {
  return NextResponse.json({ alerts: await db.select().from(priceAlerts).orderBy(desc(priceAlerts.createdAt)) });
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.symbol || !Number.isFinite(Number(body.targetValue))) return NextResponse.json({ error: "Symbol and target value are required" }, { status: 400 });
    const asset = (await getLiveTickers()).find((item) => item.symbol === body.symbol);
    const now = new Date().toISOString();
    const [alert] = await db.insert(priceAlerts).values({
      id: crypto.randomUUID(), userId: "default", symbol: body.symbol, name: asset?.name || body.symbol,
      market: asset?.market || "forex", alertType: body.alertType || "price_above",
      targetValue: String(body.targetValue), currentValue: asset ? String(asset.currentPrice) : null,
      isActive: true, isTriggered: false, createdAt: now, updatedAt: now,
    }).returning();
    return NextResponse.json({ success: true, alert, message: `Alert saved for ${body.symbol}` }, { status: 201 });
  } catch (error: any) { return NextResponse.json({ error: error.message || "Failed to save alert" }, { status: 500 }); }
}
