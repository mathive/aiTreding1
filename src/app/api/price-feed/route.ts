import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ feed: [], timestamp: Date.now() }); }
