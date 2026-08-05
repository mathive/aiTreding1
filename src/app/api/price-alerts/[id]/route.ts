import { NextResponse } from "next/server";
import { db } from "@/db";
import { priceAlerts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const update: Record<string, any> = {};
    if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);
    if (body.targetValue !== undefined) update.targetValue = String(body.targetValue);
    if (body.alertType !== undefined) update.alertType = body.alertType;
    if (body.notes !== undefined) update.notes = body.notes;
    if (body.resetTrigger) {
      update.isTriggered = false;
      update.triggeredAt = null;
    }

    const [updated] = await db
      .update(priceAlerts)
      .set(update)
      .where(eq(priceAlerts.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

    return NextResponse.json({ success: true, alert: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update alert" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(priceAlerts).where(eq(priceAlerts.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Alert deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete alert" }, { status: 500 });
  }
}
