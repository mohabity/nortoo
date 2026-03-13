import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { customers, orders } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { hashPhone } from "@/lib/hash";

/**
 * GET /api/customers/lookup?phone=0661234567
 * Lookup a customer by phone number for auto-fill in the manual order form.
 * Returns name, city, last address, and order stats — never returns phoneHash.
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId();
    const phone = request.nextUrl.searchParams.get("phone");

    if (!phone || phone.trim().length < 5) {
      return NextResponse.json({ found: false });
    }

    const phoneHash = hashPhone(phone.trim());

    const [customer] = await db
      .select({
        name: customers.name,
        city: customers.city,
        phoneLast4: customers.phoneLast4,
        totalOrders: customers.totalOrders,
        successfulOrders: customers.successfulOrders,
        failedOrders: customers.failedOrders,
      })
      .from(customers)
      .where(
        and(
          eq(customers.merchantId, merchantId),
          eq(customers.phoneHash, phoneHash),
          eq(customers.isOpposed, false)
        )
      )
      .limit(1);

    if (!customer) {
      return NextResponse.json({ found: false });
    }

    // Get last address from most recent order for this customer
    const [lastOrder] = await db
      .select({ shippingAddress: orders.shippingAddress })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.customerPhoneLast4, customer.phoneLast4 ?? "")
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(1);

    return NextResponse.json({
      found: true,
      name: customer.name,
      city: customer.city,
      phoneLast4: customer.phoneLast4,
      totalOrders: customer.totalOrders,
      successfulOrders: customer.successfulOrders,
      failedOrders: customer.failedOrders,
      lastAddress: lastOrder?.shippingAddress ?? null,
    });
  } catch (error) {
    console.error("[Customer Lookup] Error:", error);
    return NextResponse.json({ found: false });
  }
}
