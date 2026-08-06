import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ bot: null, strategies: [], openTradesCount: 0 }); }
export async function PATCH() { return NextResponse.json({ success: true }); }
