import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ mode: "live", message: "Always LIVE — MT5 connected" }); }
