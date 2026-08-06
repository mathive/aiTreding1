import { NextResponse } from "next/server";
import { db } from "@/db";
import { watchlists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helper";
import { getLiveTickers } from "@/lib/market-data-service";
import { and, desc, eq } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  const items = await db.select().from(watchlists).where(eq(watchlists.userId, user.id)).orderBy(desc(watchlists.createdAt));
  return NextResponse.json({ watchlist: items, items });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const symbol = String(body.symbol || "").trim().toUpperCase();
    if (!symbol) return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    const [existing] = await db.select().from(watchlists).where(and(eq(watchlists.userId, user.id), eq(watchlists.symbol, symbol))).limit(1);
    if (existing) return NextResponse.json({ success: true, item: existing, duplicate: true });
    const asset = (await getLiveTickers()).find((candidate) => candidate.symbol.toUpperCase() === symbol);
    if (!asset) return NextResponse.json({ error: `${symbol} is not available from MT5` }, { status: 404 });
    const now = new Date().toISOString();
    const [item] = await db.insert(watchlists).values({
      id: crypto.randomUUID(), userId: user.id, symbol: asset.symbol, name: asset.name,
      market: asset.market, aiSentiment: asset.trendStatus, aiScore: asset.aiConfidence,
      favorite: false, createdAt: now, updatedAt: now,
    }).returning();
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add watchlist item" }, { status: 500 });
  }
}
