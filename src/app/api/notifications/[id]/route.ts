import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(notifications).where(eq(notifications.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: error.message || "Failed to delete notification" }, { status: 500 });
  }
}
