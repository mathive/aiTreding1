import { NextResponse } from "next/server";
import { seedDatabaseIfEmpty } from "@/lib/seed";
import { db } from "@/db";
import { users, strategies, botConfigs, trades, watchlists, backtests, notifications, aiConversations, exchangeKeys, priceAlerts, scanSchedules, priceFeedSnapshots } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.reset) {
      // Clear all and reseed
      await db.delete(priceFeedSnapshots);
      await db.delete(scanSchedules);
      await db.delete(priceAlerts);
      await db.delete(exchangeKeys);
      await db.delete(notifications);
      await db.delete(aiConversations);
      await db.delete(backtests);
      await db.delete(watchlists);
      await db.delete(trades);
      await db.delete(botConfigs);
      await db.delete(strategies);
      await db.delete(users);
    }

    const result = await seedDatabaseIfEmpty();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Error in seed route:", error);
    return NextResponse.json({ error: error.message || "Failed to seed" }, { status: 500 });
  }
}
