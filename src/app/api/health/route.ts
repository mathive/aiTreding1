import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.select().from(users).limit(1);
    return Response.json({ ok: true, count: result.length });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
