import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";

export async function POST(request: Request) {
  try {
    const cu = await getCurrentUser();
    const body = await request.json();
    if (body.userId) return NextResponse.json({ success: true, user: cu, message: "Switched" });
    if (body.createNew) return NextResponse.json({ success: true, user: cu, message: "User ready" });
    return NextResponse.json({ success: true, user: cu });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
