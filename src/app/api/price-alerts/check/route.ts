import { NextResponse } from "next/server";
import { db } from "@/db";
import { priceAlerts, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";
import { INITIAL_ASSETS } from "@/lib/market-data";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    const activeAlerts = await db
      .select()
      .from(priceAlerts)
      .where(and(eq(priceAlerts.userId, currentUser.id), eq(priceAlerts.isActive, true)));

    const triggeredAlerts: any[] = [];

    for (const alert of activeAlerts) {
      if (alert.isTriggered) {
        // If repeatable, check cooldown
        if (alert.repeatAfterMinutes && alert.lastNotifiedAt) {
          const cooldownMs = alert.repeatAfterMinutes * 60 * 1000;
          if (Date.now() - new Date(alert.lastNotifiedAt).getTime() < cooldownMs) continue;
        } else {
          continue;
        }
      }

      const asset = INITIAL_ASSETS.find((a) => a.symbol === alert.symbol);
      if (!asset) continue;

      const jitter = (Math.random() - 0.48) * 0.004;
      const livePrice = asset.currentPrice * (1 + jitter);
      const target = Number(alert.targetValue);
      let triggered = false;

      switch (alert.alertType) {
        case "price_above":
          triggered = livePrice >= target;
          break;
        case "price_below":
          triggered = livePrice <= target;
          break;
        case "pct_change_up":
          triggered = asset.change24h >= target;
          break;
        case "pct_change_down":
          triggered = asset.change24h <= -target;
          break;
        case "rsi_overbought":
          triggered = asset.rsi >= target;
          break;
        case "rsi_oversold":
          triggered = asset.rsi <= target;
          break;
        case "confluence_trigger":
          triggered = asset.aiConfidence >= target;
          break;
      }

      if (triggered) {
        await db
          .update(priceAlerts)
          .set({
            isTriggered: true,
            triggeredAt: new Date(),
            lastNotifiedAt: new Date(),
            currentValue: String(livePrice.toFixed(4)),
          })
          .where(eq(priceAlerts.id, alert.id));

        const [notif] = await db
          .insert(notifications)
          .values({
            id: `notif_alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: currentUser.id,
            title: `🔔 Alert Triggered: ${alert.name}`,
            message: `${alert.symbol} hit ${alert.alertType.replace(/_/g, " ")} target of ${target}. Current price: $${livePrice.toFixed(4)}`,
            type: "ai_signal",
            isRead: false,
            metadata: { alertId: alert.id, symbol: alert.symbol, price: livePrice },
          })
          .returning();

        triggeredAlerts.push({ alert, notification: notif, livePrice });
      }

      // Update current value even if not triggered
      await db
        .update(priceAlerts)
        .set({ currentValue: String(livePrice.toFixed(4)) })
        .where(eq(priceAlerts.id, alert.id));
    }

    return NextResponse.json({
      success: true,
      checkedCount: activeAlerts.length,
      triggeredCount: triggeredAlerts.length,
      triggered: triggeredAlerts,
      message:
        triggeredAlerts.length > 0
          ? `${triggeredAlerts.length} price alert(s) triggered!`
          : `Checked ${activeAlerts.length} active alerts. No triggers.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to check alerts" }, { status: 500 });
  }
}
