import { NextResponse } from "next/server";
import { db } from "@/db";
import { backtests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const list = await db
      .select()
      .from(backtests)
      .where(eq(backtests.userId, currentUser.id))
      .orderBy(desc(backtests.createdAt));

    return NextResponse.json({ backtests: list });
  } catch (error: any) {
    console.error("Error fetching backtests:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch backtests" }, { status: 500 });
  }
}
