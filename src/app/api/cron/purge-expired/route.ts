import { NextResponse } from "next/server";

export async function GET() {
  // Art. 3e: Auto-delete expired data
  // Runs daily at 3 AM via Vercel cron
  return NextResponse.json({
    data: { purged: 0 },
  });
}
