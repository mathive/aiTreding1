import { NextResponse } from "next/server";
import { db } from "@/db";
import { scanSchedules } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const schedules = await db
      .select()
      .from(scanSchedules)
      .where(eq(scanSchedules.userId, currentUser.id))
      .orderBy(desc(scanSchedules.createdAt));

    return NextResponse.json({ schedules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch schedules" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const {
      name = "Custom Scan Schedule",
      intervalSeconds = 30,
      targetMarkets = ["crypto", "stocks", "forex"],
      targetSymbols,
      scanType = "confluence",
      minConfluenceScore = 75,
      autoExecute = false,
      strategyIds,
    } = body;

    const newId = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const [schedule] = await db
      .insert(scanSchedules)
      .values({
        id: newId,
        userId: currentUser.id,
        name,
        isActive: true,
        intervalSeconds,
        targetMarkets,
        targetSymbols: targetSymbols || null,
        scanType,
        minConfluenceScore,
        autoExecute,
        strategyIds: strategyIds || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      schedule,
      message: `Scan schedule "${name}" created (every ${intervalSeconds}s)`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create schedule" }, { status: 500 });
  }
}
