import { db } from "@/db/index";
import { customers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { CustomerData } from "./types";
import { retentionDate } from "./types";

/** Upsert customer by (merchantId, phoneHash) */
export async function upsertCustomer(params: {
  merchantId: number;
  phoneHash: string;
  last4: string;
  customerName?: string;
  customerCity?: string;
  isTest: boolean;
  retentionMonths: number;
}): Promise<CustomerData> {
  const [existing] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.merchantId, params.merchantId), eq(customers.phoneHash, params.phoneHash)))
    .limit(1);

  if (existing) {
    await db
      .update(customers)
      .set({
        lastSeen: new Date(),
        totalOrders: params.isTest ? existing.totalOrders : existing.totalOrders + 1,
        name: params.customerName ?? existing.name,
        city: params.customerCity ?? existing.city,
        retentionExpiresAt: retentionDate(params.retentionMonths),
      })
      .where(eq(customers.id, existing.id));

    return {
      customerId: existing.id,
      customerHistory: {
        totalOrders: existing.totalOrders,
        successfulOrders: existing.successfulOrders,
        failedOrders: existing.failedOrders,
      },
    };
  }

  const [inserted] = await db
    .insert(customers)
    .values({
      merchantId: params.merchantId,
      phoneHash: params.phoneHash,
      phoneLast4: params.last4,
      name: params.customerName,
      city: params.customerCity,
      totalOrders: params.isTest ? 0 : 1,
      successfulOrders: 0,
      failedOrders: 0,
      retentionExpiresAt: retentionDate(params.retentionMonths),
    })
    .returning({ id: customers.id });

  return { customerId: inserted.id };
}
