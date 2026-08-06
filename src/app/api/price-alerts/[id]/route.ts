import { NextResponse } from "next/server";
import { db } from "@/db";
import { priceAlerts } from "@/db/schema";
import { eq } from "drizzle-orm";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const body = await request.json();
  const [alert] = await db.update(priceAlerts).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(priceAlerts.id, id)).returning();
  return alert ? NextResponse.json({ success: true, alert }) : NextResponse.json({ error: "Alert not found" }, { status: 404 });
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [alert] = await db.delete(priceAlerts).where(eq(priceAlerts.id, id)).returning();
  return alert ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Alert not found" }, { status: 404 });
}
