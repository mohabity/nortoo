import { NextResponse } from "next/server";

export async function POST() {
  // Phase 2: Stripe billing lifecycle
  return NextResponse.json({
    error: "Not implemented — Phase 2",
    code: "NOT_IMPLEMENTED",
  }, { status: 501 });
}
