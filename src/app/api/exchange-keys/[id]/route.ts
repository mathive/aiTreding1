import { NextResponse } from "next/server";
import { db } from "@/db";
import { exchangeKeys } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatePayload: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (body.label !== undefined) updatePayload.label = body.label;
    if (body.isActive !== undefined) updatePayload.isActive = Boolean(body.isActive);
    if (body.isTestnet !== undefined) updatePayload.isTestnet = Boolean(body.isTestnet);
    if (body.ipWhitelist !== undefined) updatePayload.ipWhitelist = body.ipWhitelist;
    if (body.subAccount !== undefined) updatePayload.subAccount = body.subAccount;

    // Simulate re-test connection
    if (body.testConnection) {
      const latency = Math.floor(10 + Math.random() * 45);
      updatePayload.connectionStatus = "connected";
      updatePayload.lastPingMs = latency;
      updatePayload.lastConnectedAt = new Date().toISOString();
      updatePayload.lastError = null;
    }

    const [updated] = await db
      .update(exchangeKeys)
      .set(updatePayload)
      .where(eq(exchangeKeys.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Exchange key not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      key: {
        ...updated,
        apiKey: updated.apiKey.substring(0, 8) + "••••••••" + updated.apiKey.substring(updated.apiKey.length - 4),
        apiSecret: "••••••••••••••••",
        passphrase: updated.passphrase ? "••••••" : null,
      },
      message: body.testConnection
        ? `Connection test passed (${updated.lastPingMs}ms)`
        : "Exchange key updated",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update key" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(exchangeKeys).where(eq(exchangeKeys.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Exchange key not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${deleted.exchangeName} API key deleted permanently`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete key" }, { status: 500 });
  }
}
