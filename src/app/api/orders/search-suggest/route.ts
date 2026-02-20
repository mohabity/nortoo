import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders } from "@/db/schema";
import { eq, like, sql, and } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { normalizeForSearch } from "@/lib/search";

/**
 * GET /api/orders/search-suggest?q=fat
 * Returns top 5 unique suggestions matching the query across
 * customer names, cities, and product names.
 */
export async function GET(request: NextRequest) {
  const merchantId = await getMerchantId();
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const normalized = normalizeForSearch(q);

  // Run 3 queries in parallel: clients, cities, products
  const [clientRows, cityRows, productRows] = await Promise.all([
    db
      .select({
        value: orders.customerName,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          like(orders.searchIndex, `%${normalized}%`),
          sql`${orders.customerName} is not null`
        )
      )
      .groupBy(orders.customerName)
      .orderBy(sql`count(*) desc`)
      .limit(5),

    db
      .select({
        value: orders.shippingCity,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          like(orders.searchIndex, `%${normalized}%`),
          sql`${orders.shippingCity} is not null`
        )
      )
      .groupBy(orders.shippingCity)
      .orderBy(sql`count(*) desc`)
      .limit(5),

    db
      .select({
        value: orders.productName,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          like(orders.searchIndex, `%${normalized}%`),
          sql`${orders.productName} is not null`
        )
      )
      .groupBy(orders.productName)
      .orderBy(sql`count(*) desc`)
      .limit(5),
  ]);

  const suggestions = [
    ...clientRows
      .filter((r) => r.value)
      .map((r) => ({ type: "client" as const, value: r.value!, count: r.count })),
    ...cityRows
      .filter((r) => r.value)
      .map((r) => ({ type: "city" as const, value: r.value!, count: r.count })),
    ...productRows
      .filter((r) => r.value)
      .map((r) => ({ type: "product" as const, value: r.value!, count: r.count })),
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({ suggestions });
}
