import { NextResponse } from "next/server";
import { db } from "@/db";
import { backtests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(backtests).where(eq(backtests.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Backtest not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Backtest "${deleted.name}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("Error deleting backtest:", error);
    return NextResponse.json({ error: error.message || "Failed to delete backtest" }, { status: 500 });
  }
}
