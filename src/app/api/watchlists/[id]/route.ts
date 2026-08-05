import { NextResponse } from "next/server";
import { db } from "@/db";
import { watchlists } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { alertHigh, alertLow, favorite, notes } = body;
    const updatePayload: Record<string, any> = {};

    if (alertHigh !== undefined) updatePayload.alertHigh = alertHigh ? String(alertHigh) : null;
    if (alertLow !== undefined) updatePayload.alertLow = alertLow ? String(alertLow) : null;
    if (favorite !== undefined) updatePayload.favorite = Boolean(favorite);
    if (notes !== undefined) updatePayload.notes = notes;

    const [updated] = await db
      .update(watchlists)
      .set(updatePayload)
      .where(eq(watchlists.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: updated,
      message: `Watchlist item updated`,
    });
  } catch (error: any) {
    console.error("Error updating watchlist item:", error);
    return NextResponse.json({ error: error.message || "Failed to update watchlist item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(watchlists).where(eq(watchlists.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Removed from watchlist`,
    });
  } catch (error: any) {
    console.error("Error deleting watchlist item:", error);
    return NextResponse.json({ error: error.message || "Failed to delete watchlist item" }, { status: 500 });
  }
}
