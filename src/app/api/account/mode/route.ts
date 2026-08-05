import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, exchangeKeys, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { mode } = body; // "paper" | "live"

    if (!["paper", "live"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode. Use 'paper' or 'live'" }, { status: 400 });
    }

    if (mode === "live") {
      // Verify user has at least one active exchange key
      const activeKeys = await db
        .select()
        .from(exchangeKeys)
        .where(
          and(
            eq(exchangeKeys.userId, currentUser.id),
            eq(exchangeKeys.isActive, true),
            eq(exchangeKeys.connectionStatus, "connected")
          )
        );

      if (activeKeys.length === 0) {
        return NextResponse.json({
          error: "Cannot switch to LIVE mode without a connected exchange API key. Please add and verify an exchange connection first.",
          requiresKey: true,
        }, { status: 400 });
      }

      // Check if any key is NOT testnet
      const hasMainnetKey = activeKeys.some((k) => !k.isTestnet);
      const keyType = hasMainnetKey ? "MAINNET" : "TESTNET";

      const [updated] = await db
        .update(users)
        .set({
          tradingMode: "live",
          isLiveVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, currentUser.id))
        .returning();

      // Create notification
      await db.insert(notifications).values({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        title: `⚡ LIVE Trading Mode Activated (${keyType})`,
        message: `All new trades will be routed to your connected exchange(s). ${activeKeys.length} active API key(s) verified. Risk management limits remain enforced.`,
        type: "system",
        isRead: false,
        metadata: { mode: "live", keyCount: activeKeys.length, keyType },
      });

      return NextResponse.json({
        success: true,
        mode: "live",
        keyType,
        activeKeysCount: activeKeys.length,
        user: updated,
        message: `LIVE trading mode activated with ${activeKeys.length} exchange connection(s) (${keyType})`,
      });
    } else {
      // Switch to paper
      const [updated] = await db
        .update(users)
        .set({
          tradingMode: "paper",
          updatedAt: new Date(),
        })
        .where(eq(users.id, currentUser.id))
        .returning();

      await db.insert(notifications).values({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        title: "📝 Paper Trading Mode Active",
        message: "All trades are now simulated. No real orders will be sent to exchanges.",
        type: "system",
        isRead: false,
        metadata: { mode: "paper" },
      });

      return NextResponse.json({
        success: true,
        mode: "paper",
        user: updated,
        message: "Paper trading mode activated. All trades are simulated.",
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to switch mode" }, { status: 500 });
  }
}
