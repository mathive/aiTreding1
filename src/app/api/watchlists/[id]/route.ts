import { NextResponse } from "next/server";
import { db } from "@/db";
import { watchlists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helper";
import { and, eq } from "drizzle-orm";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await context.params;
  const body = await request.json();
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.favorite !== undefined) update.favorite = Boolean(body.favorite);
  if (body.alertHigh !== undefined) update.alertHigh = body.alertHigh === null ? null : String(body.alertHigh);
  if (body.alertLow !== undefined) update.alertLow = body.alertLow === null ? null : String(body.alertLow);
  if (body.notes !== undefined) update.notes = body.notes === null ? null : String(body.notes);
  const [item] = await db.update(watchlists).set(update).where(and(eq(watchlists.id, id), eq(watchlists.userId, user.id))).returning();
  if (!item) return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 });
  return NextResponse.json({ success: true, item });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await context.params;
  const [item] = await db.delete(watchlists).where(and(eq(watchlists.id, id), eq(watchlists.userId, user.id))).returning();
  if (!item) return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
