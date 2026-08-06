// Seed disabled — app starts completely empty, no demo data.
export const DEMO_USER_ID = "user_default";

export async function seedDatabaseIfEmpty() {
  // No seeding. User data only comes from real MT5 connections.
  return { status: "clean_start" };
}
