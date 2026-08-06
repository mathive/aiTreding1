import { NextResponse } from "next/server";
import { db } from "@/db";
import { strategies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      category,
      traderTypeMatch,
      timeframes,
      indicators,
      targetAssets,
      weight,
      minConfidence,
      stopLossPercent,
      takeProfitPercent,
      trailingStop,
      isActive,
    } = body;

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (category !== undefined) updatePayload.category = category;
    if (traderTypeMatch !== undefined) updatePayload.traderTypeMatch = traderTypeMatch;
    if (timeframes !== undefined) updatePayload.timeframes = timeframes;
    if (indicators !== undefined) updatePayload.indicators = indicators;
    if (targetAssets !== undefined) updatePayload.targetAssets = targetAssets;
    if (weight !== undefined) updatePayload.weight = Number(weight);
    if (minConfidence !== undefined) updatePayload.minConfidence = Number(minConfidence);
    if (stopLossPercent !== undefined) updatePayload.stopLossPercent = String(stopLossPercent);
    if (takeProfitPercent !== undefined) updatePayload.takeProfitPercent = String(takeProfitPercent);
    if (trailingStop !== undefined) updatePayload.trailingStop = Boolean(trailingStop);
    if (isActive !== undefined) updatePayload.isActive = Boolean(isActive);

    const [updated] = await db
      .update(strategies)
      .set(updatePayload)
      .where(eq(strategies.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      strategy: updated,
      message: `Strategy "${updated.name}" updated`,
    });
  } catch (error: any) {
    console.error("Error updating strategy:", error);
    return NextResponse.json({ error: error.message || "Failed to update strategy" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(strategies).where(eq(strategies.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      strategy: deleted,
      message: `Strategy "${deleted.name}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("Error deleting strategy:", error);
    return NextResponse.json({ error: error.message || "Failed to delete strategy" }, { status: 500 });
  }
}
