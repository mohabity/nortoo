import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders } from "@/db/schema";
import { and, eq, gte, count, avg, sql } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * GET /api/dashboard/chart
 *
 * Returns daily order count + average fraud score for the last 14 days.
 * Used to render the main dashboard area chart.
 */
export async function GET() {
  try {
    const merchantId = await getMerchantId();

    // Last 14 days
    const since = new Date();
    since.setDate(since.getDate() - 13); // 14 days including today
    since.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
        commandes: count(),
        score: avg(orders.fraudScore),
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.isTest, false),
          gte(orders.createdAt, since),
        )
      )
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

    // Build a complete 14-day array (fill missing days with 0)
    const rowMap = new Map(rows.map((r) => [r.day, r]));
    const data: Array<{ date: string; commandes: number; score: number }> = [];

    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

      const row = rowMap.get(key);
      data.push({
        date: label,
        commandes: row ? row.commandes : 0,
        score: row ? Math.round(Number(row.score) || 0) : 0,
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[Chart] Error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
