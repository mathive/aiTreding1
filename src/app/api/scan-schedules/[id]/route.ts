import { NextResponse } from "next/server";
import { db } from "@/db";
import { scanSchedules } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const update: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);
    if (body.intervalSeconds !== undefined) update.intervalSeconds = Number(body.intervalSeconds);
    if (body.scanType !== undefined) update.scanType = body.scanType;
    if (body.minConfluenceScore !== undefined) update.minConfluenceScore = Number(body.minConfluenceScore);
    if (body.autoExecute !== undefined) update.autoExecute = Boolean(body.autoExecute);
    if (body.targetMarkets !== undefined) update.targetMarkets = body.targetMarkets;
    if (body.targetSymbols !== undefined) update.targetSymbols = body.targetSymbols;
    if (body.name !== undefined) update.name = body.name;
    if (body.strategyIds !== undefined) update.strategyIds = body.strategyIds;

    // Simulate a scan run completion
    if (body.markRun) {
      update.lastRunAt = new Date().toISOString();
      update.lastRunDurationMs = Math.floor(50 + Math.random() * 400);
      update.totalScansRun = body.totalScansRun ? body.totalScansRun + 1 : 1;
    }

    const [updated] = await db
      .update(scanSchedules)
      .set(update)
      .where(eq(scanSchedules.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    return NextResponse.json({ success: true, schedule: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update schedule" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(scanSchedules).where(eq(scanSchedules.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Scan schedule deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete schedule" }, { status: 500 });
  }
}
