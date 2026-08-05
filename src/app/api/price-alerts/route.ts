import { NextResponse } from "next/server";
import { db } from "@/db";
import { priceAlerts, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";
import { INITIAL_ASSETS } from "@/lib/market-data";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const alerts = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.userId, currentUser.id))
      .orderBy(desc(priceAlerts.createdAt));

    // Hydrate with live prices
    const hydrated = alerts.map((a) => {
      const asset = INITIAL_ASSETS.find((m) => m.symbol === a.symbol);
      return {
        ...a,
        livePrice: asset?.currentPrice || 0,
        change24h: asset?.change24h || 0,
        distancePercent: asset
          ? (((Number(a.targetValue) - asset.currentPrice) / asset.currentPrice) * 100).toFixed(2)
          : "0",
      };
    });

    return NextResponse.json({ alerts: hydrated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const {
      symbol,
      alertType = "price_above",
      targetValue,
      condition = ">=",
      repeatAfterMinutes,
      notes,
    } = body;

    if (!symbol || targetValue === undefined) {
      return NextResponse.json({ error: "Symbol and target value are required" }, { status: 400 });
    }

    const asset = INITIAL_ASSETS.find((a) => a.symbol === symbol);
    const newId = `pa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const nameMap: Record<string, string> = {
      price_above: `${symbol} Above $${targetValue}`,
      price_below: `${symbol} Below $${targetValue}`,
      pct_change_up: `${symbol} +${targetValue}% Surge`,
      pct_change_down: `${symbol} -${targetValue}% Drop`,
      rsi_overbought: `${symbol} RSI > ${targetValue}`,
      rsi_oversold: `${symbol} RSI < ${targetValue}`,
      confluence_trigger: `${symbol} AI Score ≥ ${targetValue}%`,
    };

    const [alert] = await db
      .insert(priceAlerts)
      .values({
        id: newId,
        userId: currentUser.id,
        symbol,
        name: nameMap[alertType] || `${symbol} Alert`,
        market: asset?.market || "crypto",
        alertType,
        targetValue: String(targetValue),
        currentValue: String(asset?.currentPrice || 0),
        condition,
        isActive: true,
        isTriggered: false,
        repeatAfterMinutes: repeatAfterMinutes || null,
        notificationChannels: ["in_app", "sound"],
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      alert,
      message: `Price alert set: ${nameMap[alertType] || symbol}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create alert" }, { status: 500 });
  }
}
