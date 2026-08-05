import { NextResponse } from "next/server";
import { db } from "@/db";
import { strategies } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const traderType = searchParams.get("traderType");

    const allStrategies = await db.select().from(strategies);

    let filtered = allStrategies;
    if (category && category !== "all") {
      filtered = filtered.filter((s) => s.category === category);
    }
    if (traderType && traderType !== "all") {
      filtered = filtered.filter(
        (s) => s.traderTypeMatch === "all" || s.traderTypeMatch === traderType
      );
    }

    return NextResponse.json({
      strategies: filtered,
      total: filtered.length,
      currentTraderType: currentUser.traderType,
    });
  } catch (error: any) {
    console.error("Error fetching strategies:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch strategies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const {
      name,
      description,
      category,
      traderTypeMatch = "all",
      timeframes = ["15m", "1h"],
      indicators = {},
      targetAssets = ["BTC/USDT", "NVDA", "SOL/USDT"],
      weight = 25,
      minConfidence = 75,
      stopLossPercent = "2.00",
      takeProfitPercent = "5.00",
      trailingStop = true,
      aiPromptOrigin,
    } = body;

    if (!name || !description || !category) {
      return NextResponse.json({ error: "Name, description, and category are required" }, { status: 400 });
    }

    const newId = `strat_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const [newStrategy] = await db
      .insert(strategies)
      .values({
        id: newId,
        userId: currentUser.id,
        name,
        description,
        category,
        traderTypeMatch,
        timeframes,
        indicators,
        targetAssets,
        weight: Number(weight),
        minConfidence: Number(minConfidence),
        stopLossPercent: String(stopLossPercent),
        takeProfitPercent: String(takeProfitPercent),
        trailingStop: Boolean(trailingStop),
        isActive: true,
        winRate: "70.00",
        totalTradesCount: 0,
        profitFactor: "2.50",
        isCustom: true,
        aiPromptOrigin,
      })
      .returning();

    return NextResponse.json({
      success: true,
      strategy: newStrategy,
      message: `Strategy "${newStrategy.name}" created successfully`,
    });
  } catch (error: any) {
    console.error("Error creating strategy:", error);
    return NextResponse.json({ error: error.message || "Failed to create strategy" }, { status: 500 });
  }
}
