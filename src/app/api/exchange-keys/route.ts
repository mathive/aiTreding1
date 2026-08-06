import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ keys: [] }); }
export async function POST() { return NextResponse.json({ success: true, key: {}, message: "Exchange keys not needed — MT5 direct" }); }
