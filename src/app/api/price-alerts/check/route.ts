import { NextResponse } from "next/server";
import { db } from "@/db";
import { priceAlerts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getLiveTickers } from "@/lib/market-data-service";
export async function POST() {
  try {
    const alerts = await db.select().from(priceAlerts).where(and(eq(priceAlerts.isActive, true), eq(priceAlerts.isTriggered, false)));
    if (!alerts.length) return NextResponse.json({ success: true, triggeredCount: 0 });
    const prices = new Map((await getLiveTickers()).map((asset) => [asset.symbol, asset.currentPrice]));
    let triggeredCount = 0;
    for (const alert of alerts) {
      const price = prices.get(alert.symbol); if (price === undefined) continue;
      const target = Number(alert.targetValue);
      const triggered = alert.alertType === "price_below" ? price <= target : price >= target;
      const changes: Record<string, any> = { currentValue: String(price), updatedAt: new Date().toISOString() };
      if (triggered) { changes.isTriggered = true; changes.isActive = false; changes.triggeredAt = new Date().toISOString(); triggeredCount++; }
      await db.update(priceAlerts).set(changes).where(eq(priceAlerts.id, alert.id));
    }
    return NextResponse.json({ success: true, triggeredCount });
  } catch (error: any) { return NextResponse.json({ error: error.message || "Alert check failed" }, { status: 500 }); }
}
