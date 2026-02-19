import { NextResponse } from "next/server";

export async function POST() {
  // Art. 7: Data access request
  return NextResponse.json({
    error: "Not implemented",
    code: "NOT_IMPLEMENTED",
  }, { status: 501 });
}
