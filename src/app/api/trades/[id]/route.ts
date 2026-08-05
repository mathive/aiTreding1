import { NextResponse } from "next/server";
import { db } from "@/db";
import { trades } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { stopLoss, takeProfit, trailingStop, trailingDistance, notes } = body;

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (stopLoss !== undefined) updatePayload.stopLoss = stopLoss ? String(stopLoss) : null;
    if (takeProfit !== undefined) updatePayload.takeProfit = takeProfit ? String(takeProfit) : null;
    if (trailingStop !== undefined) updatePayload.trailingStop = Boolean(trailingStop);
    if (trailingDistance !== undefined) updatePayload.trailingDistance = trailingDistance ? String(trailingDistance) : null;
    if (notes !== undefined) updatePayload.notes = notes;

    const [updated] = await db
      .update(trades)
      .set(updatePayload)
      .where(eq(trades.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      trade: updated,
      message: `Position on ${updated.symbol} updated`,
    });
  } catch (error: any) {
    console.error("Error updating trade:", error);
    return NextResponse.json({ error: error.message || "Failed to update trade" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(trades).where(eq(trades.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      trade: deleted,
      message: `Trade log on ${deleted.symbol} removed`,
    });
  } catch (error: any) {
    console.error("Error deleting trade:", error);
    return NextResponse.json({ error: error.message || "Failed to delete trade" }, { status: 500 });
  }
}
