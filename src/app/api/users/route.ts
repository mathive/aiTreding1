import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";

export async function GET() {
  try {
    const cu = await getCurrentUser();
    return NextResponse.json({ user: cu, availableUsers: [] });
  } catch (e: any) { return NextResponse.json({ user: null, availableUsers: [] }); }
}
export async function PATCH(request: Request) {
  try {
    const cu = await getCurrentUser();
    return NextResponse.json({ success: true, user: cu });
  } catch { return NextResponse.json({ success: true, user: null }); }
}
