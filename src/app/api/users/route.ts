import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function ensureUser() {
  const fallback = await getCurrentUser();
  await db.insert(users).values({ ...fallback, createdAt: fallback.createdAt, updatedAt: fallback.updatedAt }).onConflictDoNothing();
  const [saved] = await db.select().from(users).where(eq(users.id, "default"));
  return { ...fallback, ...saved };
}

export async function GET() {
  try {
    const cu = await ensureUser();
    return NextResponse.json({ user: cu, availableUsers: [] });
  } catch (e: any) { return NextResponse.json({ user: null, availableUsers: [] }); }
}
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const current = await ensureUser();
    const allowed = ["name", "traderType", "riskMode", "maxDailyLoss", "maxLeverage", "autoTradingEnabled", "soundEffects", "theme", "apiKeySimulation", "tradingMode"] as const;
    const changes: Record<string, any> = { updatedAt: new Date().toISOString() };
    for (const key of allowed) if (body[key] !== undefined) changes[key] = body[key];
    const [saved] = await db.update(users).set(changes).where(eq(users.id, current.id)).returning();
    return NextResponse.json({ success: true, user: saved });
  } catch (error: any) { return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 }); }
}
