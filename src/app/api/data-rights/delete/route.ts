import { NextResponse } from "next/server";

export async function POST() {
  // Art. 8: Data deletion request
  return NextResponse.json({
    error: "Not implemented",
    code: "NOT_IMPLEMENTED",
  }, { status: 501 });
}
