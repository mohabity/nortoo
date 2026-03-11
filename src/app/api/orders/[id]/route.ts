import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, customers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const merchantId = await getMerchantId();
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Fetch order — tenant isolation via merchantId
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)));

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Parse scoring factors from JSON string
    let scoringFactors: { rule: string; points: number; reason: string }[] = [];
    if (order.scoringFactors) {
      try {
        scoringFactors = JSON.parse(order.scoringFactors);
      } catch {
        scoringFactors = [];
      }
    }

    // Parse score explanation from JSON string
    let scoreExplanation = null;
    if (order.scoreExplanation) {
      try {
        scoreExplanation = JSON.parse(order.scoreExplanation);
      } catch { /* ignore */ }
    }

    // Fetch customer if linked
    let customer = null;
    if (order.customerId) {
      const [cust] = await db
        .select({
          id: customers.id,
          name: customers.name,
          city: customers.city,
          phoneLast4: customers.phoneLast4,
          totalOrders: customers.totalOrders,
          successfulOrders: customers.successfulOrders,
          failedOrders: customers.failedOrders,
          firstSeen: customers.firstSeen,
        })
        .from(customers)
        .where(and(eq(customers.id, order.customerId), eq(customers.merchantId, merchantId)));
      customer = cust ?? null;
    }

    // Compute confidence from customer stats
    let confidence = 0.5;
    if (customer) {
      if (customer.totalOrders >= 3) confidence = 0.9;
      else if (customer.totalOrders >= 1) confidence = 0.7;
    }

    return NextResponse.json({
      data: {
        ...order,
        scoringFactors,
        scoreExplanation,
        confidence,
        customer,
      },
    });
  } catch (err) {
    console.error("[api/orders/[id]] Error:", err);
    return NextResponse.json(
      { error: "Une erreur interne s'est produite." },
      { status: 500 }
    );
  }
}
