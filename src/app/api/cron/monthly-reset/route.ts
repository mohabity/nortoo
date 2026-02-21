import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";

/**
 * GET /api/cron/monthly-reset
 * Runs on the 1st of every month (0 0 1 * *).
 * Resets currentMonthOrders = 0 and updates currentMonthStart for all merchants.
 */
export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const result = await db
      .update(merchants)
      .set({
        currentMonthOrders: 0,
        currentMonthStart: now,
      });

    console.log(
      `[monthly-reset] Reset currentMonthOrders for all merchants at ${now.toISOString()}`
    );

    return NextResponse.json({
      ok: true,
      resetAt: now.toISOString(),
    });
  } catch (err) {
    console.error("[monthly-reset] Error:", err);
    return NextResponse.json(
      { error: "Reset failed" },
      { status: 500 }
    );
  }
}
