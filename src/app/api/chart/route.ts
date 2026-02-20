import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

// French month abbreviations
const MONTHS_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

function formatDateFR(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS_FR[date.getMonth()];
  return `${day} ${month}`;
}

/**
 * GET /api/chart
 * Returns order trends (count + avg score) for the last 14 days.
 */
export async function GET() {
  const merchantId = await getMerchantId();

  // 14 days ago at midnight
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);

  // Query: group by date
  const rows = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`.as("date"),
      commandes: sql<number>`count(*)`.as("commandes"),
      score: sql<number>`round(avg(${orders.fraudScore}))`.as("score"),
    })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchantId),
        gte(orders.createdAt, startDate)
      )
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  // Build a map of date string → row for fast lookup
  const dataMap = new Map<string, { commandes: number; score: number }>();
  for (const row of rows) {
    // row.date comes as "YYYY-MM-DD" string from Postgres DATE()
    dataMap.set(String(row.date), {
      commandes: Number(row.commandes),
      score: Number(row.score),
    });
  }

  // Generate all 14 days, filling gaps with zeros
  const data: Array<{ date: string; commandes: number; score: number }> = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const entry = dataMap.get(key);
    data.push({
      date: formatDateFR(d),
      commandes: entry?.commandes ?? 0,
      score: entry?.score ?? 0,
    });
  }

  return NextResponse.json({ data });
}
