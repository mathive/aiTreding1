import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
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
      const [updated] = await db
        .update(users)
        .set({
          tradingMode: "live",
          isLiveVerified: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, currentUser.id))
        .returning();

      // Create notification
      await db.insert(notifications).values({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        title: "⚡ LIVE Trading Mode Activated",
        message: "All new trades will be routed to your connected MT5 account. Risk management limits remain enforced.",
        type: "system",
        isRead: false,
        metadata: { mode: "live", via: "mt5" },
      });

      return NextResponse.json({
        success: true,
        mode: "live",
        user: updated,
        message: "LIVE trading mode activated — orders routed to Vantage MT5",
      });
    } else {
      // Switch to paper
      const [updated] = await db
        .update(users)
        .set({
          tradingMode: "paper",
          updatedAt: new Date().toISOString(),
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
