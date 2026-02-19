import { NextResponse } from "next/server";

export async function POST() {
  // Art. 9: Opposition request
  return NextResponse.json({
    error: "Not implemented",
    code: "NOT_IMPLEMENTED",
  }, { status: 501 });
}
