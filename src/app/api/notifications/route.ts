import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, currentUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    const unreadCount = list.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: list,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const currentUser = await getCurrentUser();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, currentUser.id));

    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: error.message || "Failed to update notifications" }, { status: 500 });
  }
}
