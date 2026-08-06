import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const allUsers = await db.select().from(users);

    return NextResponse.json({
      user: currentUser,
      availableUsers: allUsers,
    });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const {
      name,
      traderType,
      balance,
      riskMode,
      maxDailyLoss,
      maxLeverage,
      autoTradingEnabled,
      soundEffects,
      apiKeySimulation,
      resetToInitial,
    } = body;

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updatePayload.name = name;
    if (traderType !== undefined) updatePayload.traderType = traderType;
    if (riskMode !== undefined) updatePayload.riskMode = riskMode;
    if (maxDailyLoss !== undefined) updatePayload.maxDailyLoss = String(maxDailyLoss);
    if (maxLeverage !== undefined) updatePayload.maxLeverage = Number(maxLeverage);
    // SQLite booleans are stored as integers (0/1), drizzle handles mode:"boolean"
    if (autoTradingEnabled !== undefined) updatePayload.autoTradingEnabled = Boolean(autoTradingEnabled);
    if (soundEffects !== undefined) updatePayload.soundEffects = Boolean(soundEffects);
    if (apiKeySimulation !== undefined) updatePayload.apiKeySimulation = Boolean(apiKeySimulation);

    if (resetToInitial) {
      updatePayload.balance = currentUser.initialBalance;
    } else if (balance !== undefined) {
      updatePayload.balance = String(balance);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, currentUser.id))
      .returning();

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Account settings updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}
