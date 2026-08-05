import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEMO_USER_ID, seedDatabaseIfEmpty } from "./seed";
import { cookies } from "next/headers";

export async function getCurrentUser() {
  await seedDatabaseIfEmpty();

  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("nexus_user_id")?.value;
  const targetId = userIdCookie || DEMO_USER_ID;

  let user = await db.select().from(users).where(eq(users.id, targetId)).limit(1);

  if (user.length === 0) {
    user = await db.select().from(users).where(eq(users.id, DEMO_USER_ID)).limit(1);
  }

  if (user.length > 0) {
    return user[0];
  }

  // If still empty, return fallback
  return {
    id: DEMO_USER_ID,
    name: "Alex Vance",
    email: "alex.vance@nexustrader.ai",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "pro_trader",
    traderType: "day_trader",
    balance: "58240.50",
    initialBalance: "50000.00",
    currency: "USD",
    riskMode: "moderate",
    maxDailyLoss: "2500.00",
    maxLeverage: 10,
    autoTradingEnabled: true,
    soundEffects: true,
    theme: "dark",
    apiKeySimulation: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
