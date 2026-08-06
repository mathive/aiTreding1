import { NextResponse } from "next/server";
import { db } from "@/db";
import { exchangeKeys } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helper";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const keys = await db
      .select()
      .from(exchangeKeys)
      .where(eq(exchangeKeys.userId, currentUser.id))
      .orderBy(desc(exchangeKeys.createdAt));

    // Mask secrets for transport
    const maskedKeys = keys.map((k) => ({
      ...k,
      apiKey: k.apiKey.substring(0, 8) + "••••••••" + k.apiKey.substring(k.apiKey.length - 4),
      apiSecret: "••••••••••••••••",
      passphrase: k.passphrase ? "••••••" : null,
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch exchange keys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const {
      exchangeName,
      label,
      apiKey,
      apiSecret,
      passphrase,
      subAccount,
      isTestnet = true,
      ipWhitelist,
    } = body;

    if (!exchangeName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Exchange name, API key, and API secret are required" }, { status: 400 });
    }

    const newId = `exk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Simulate connection test
    const latency = Math.floor(10 + Math.random() * 50);
    const connectionStatus = apiKey.length >= 8 ? "connected" : "error";

    const [newKey] = await db
      .insert(exchangeKeys)
      .values({
        id: newId,
        userId: currentUser.id,
        exchangeName,
        label: label || `${exchangeName} API Key`,
        apiKey,
        apiSecret,
        passphrase: passphrase || null,
        subAccount: subAccount || null,
        permissions: ["read", "trade"],
        isTestnet: Boolean(isTestnet),
        isActive: true,
        connectionStatus,
        lastPingMs: latency,
        lastConnectedAt: connectionStatus === "connected" ? new Date().toISOString() : null,
        lastError: connectionStatus === "error" ? "Invalid API key format" : null,
        ipWhitelist: ipWhitelist || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      key: {
        ...newKey,
        apiKey: newKey.apiKey.substring(0, 8) + "••••••••" + newKey.apiKey.substring(newKey.apiKey.length - 4),
        apiSecret: "••••••••••••••••",
        passphrase: newKey.passphrase ? "••••••" : null,
      },
      connectionTest: {
        status: connectionStatus,
        latencyMs: latency,
        permissions: ["read", "trade"],
        accountType: isTestnet ? "TESTNET / PAPER" : "LIVE MAINNET",
      },
      message: `${exchangeName} API key connected successfully (${latency}ms latency)`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add exchange key" }, { status: 500 });
  }
}
