import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ status: "clean", message: "No seeding — real MT5 only" }); }
