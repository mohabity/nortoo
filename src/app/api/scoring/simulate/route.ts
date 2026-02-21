import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, merchants } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { getMerchantId } from "@/lib/merchant";
import {
  simulateThresholds,
  type SimOrderInput,
} from "@/lib/scoring-simulator";

const simulateSchema = z.object({
  thresholds: z
    .object({
      verify: z.number().int().min(10).max(98),
      flag: z.number().int().min(11).max(99),
      block: z.number().int().min(12).max(99),
    })
    .refine((d) => d.verify < d.flag && d.flag < d.block, {
      message: "Les seuils doivent être dans l'ordre : vérifier < signaler < bloquer",
    }),
  limit: z.number().int().min(20).max(500).default(200),
});

export async function POST(request: Request) {
  const merchantId = await getMerchantId();

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = simulateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { thresholds, limit } = parsed.data;

  // Fetch merchant settings (current thresholds + RTO costs)
  const [merchant] = await db
    .select({
      verifyThreshold: merchants.verifyThreshold,
      flagThreshold: merchants.flagThreshold,
      blockThreshold: merchants.blockThreshold,
      rtoCostFixed: merchants.rtoCostFixed,
      rtoCostPercent: merchants.rtoCostPercent,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!merchant) {
    return NextResponse.json(
      { error: "Marchand introuvable" },
      { status: 404 }
    );
  }

  // Fetch recent real orders with scoring data
  const rawOrders = await db
    .select({
      id: orders.id,
      externalRef: orders.externalRef,
      customerName: orders.customerName,
      fraudScore: orders.fraudScore,
      decision: orders.decision,
      deliveryStatus: orders.deliveryStatus,
      total: orders.total,
    })
    .from(orders)
    .where(
      and(eq(orders.merchantId, merchantId), eq(orders.isTest, false))
    )
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  // Guard: insufficient data
  if (rawOrders.length < 20) {
    return NextResponse.json(
      {
        error: "insufficient_data",
        message: "Pas assez de données pour une simulation fiable",
        minRequired: 20,
        current: rawOrders.length,
      },
      { status: 422 }
    );
  }

  const simOrders: SimOrderInput[] = rawOrders.map((o) => ({
    id: o.id,
    externalRef: o.externalRef,
    customerName: o.customerName,
    fraudScore: o.fraudScore,
    decision: o.decision,
    deliveryStatus: o.deliveryStatus,
    total: o.total,
  }));

  const currentThresholds = {
    verify: merchant.verifyThreshold,
    flag: merchant.flagThreshold,
    block: merchant.blockThreshold,
  };

  const result = simulateThresholds(
    simOrders,
    currentThresholds,
    thresholds,
    merchant.rtoCostFixed,
    merchant.rtoCostPercent
  );

  return NextResponse.json({ data: result });
}
