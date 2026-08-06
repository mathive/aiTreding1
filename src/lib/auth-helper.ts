import { cookies } from "next/headers";

const DEFAULT_USER_ID = "user_default";

async function ensureMinimalUser() {
  const { db } = await import("@/db");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const existing = await db.select().from(users).where(eq(users.id, DEFAULT_USER_ID)).limit(1);
  if (existing.length > 0) return existing[0];

  // Create one minimal user — no demo data, zero balance
  const [newUser] = await db.insert(users).values({
    id: DEFAULT_USER_ID,
    name: "Trader",
    email: "trader@localhost",
    traderType: "day_trader",
    balance: "0.00",
    initialBalance: "0.00",
    currency: "USD",
    riskMode: "moderate",
    maxDailyLoss: "0.00",
    maxLeverage: 10,
    autoTradingEnabled: false,
    soundEffects: true,
    theme: "dark",
    apiKeySimulation: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).returning();
  return newUser;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("nexus_user_id")?.value;
  const targetId = userIdCookie || DEFAULT_USER_ID;

  try {
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const result = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
    if (result.length > 0) return result[0];
  } catch {}

  return ensureMinimalUser();
}
