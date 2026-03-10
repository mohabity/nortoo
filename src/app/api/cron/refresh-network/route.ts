import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Phase 2: Refresh network intelligence scores
  return NextResponse.json({
    error: "Not implemented — Phase 2",
    code: "NOT_IMPLEMENTED",
  }, { status: 501 });
}
