import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { customers } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * GET /api/customers/recent
 * Returns the 5 most recently seen customers for the authenticated merchant.
 * Used for "recent customers" chips on the manual order form.
 * Never returns phoneHash or full phone — only phoneLast4, name, city.
 */
export async function GET() {
  try {
    const merchantId = await getMerchantId();

    const recent = await db
      .select({
        phoneLast4: customers.phoneLast4,
        name: customers.name,
        city: customers.city,
        totalOrders: customers.totalOrders,
      })
      .from(customers)
      .where(
        and(
          eq(customers.merchantId, merchantId),
          eq(customers.isOpposed, false)
        )
      )
      .orderBy(desc(customers.lastSeen))
      .limit(5);

    return NextResponse.json({ customers: recent });
  } catch (error) {
    console.error("[Recent Customers] Error:", error);
    return NextResponse.json({ customers: [] });
  }
}
