import { cookies } from "next/headers";
const UID = "user_default";

export async function getCurrentUser() {
  const cookie = (await cookies()).get("nexus_user_id")?.value || UID;
  const { db } = await import("@/db");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const r = await db.select().from(users).where(eq(users.id, cookie)).limit(1);
  if (r.length > 0) return r[0];
  // Auto-create minimal user on first access
  const [u] = await db.insert(users).values({ id: cookie, name: "Trader", email: "trader@localhost", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).returning();
  return u;
}
