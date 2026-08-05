import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, createNew, name, traderType, initialBalance } = body;

    let targetUserId = userId;

    if (createNew && name) {
      const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const balanceStr = initialBalance ? String(initialBalance) : "50000.00";

      const [newUser] = await db
        .insert(users)
        .values({
          id: newId,
          name,
          email: `${name.toLowerCase().replace(/\s+/g, ".")}@nexustrader.ai`,
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          role: "custom_trader",
          traderType: traderType || "day_trader",
          balance: balanceStr,
          initialBalance: balanceStr,
          currency: "USD",
          riskMode: "moderate",
          maxDailyLoss: "2000.00",
          maxLeverage: 10,
          autoTradingEnabled: true,
          soundEffects: true,
          theme: "dark",
          apiKeySimulation: true,
        })
        .returning();

      targetUserId = newUser.id;
    }

    // Verify user exists
    const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set("nexus_user_id", targetUserId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      user: targetUser,
      message: `Switched active trader to ${targetUser.name}`,
    });
  } catch (error: any) {
    console.error("Error switching user:", error);
    return NextResponse.json({ error: error.message || "Failed to switch user" }, { status: 500 });
  }
}
