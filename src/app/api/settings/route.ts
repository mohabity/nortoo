import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getMerchantId } from "@/lib/merchant";

// ── Shared select columns ──
const merchantSelect = {
  name: merchants.name,
  domain: merchants.domain,
  email: merchants.email,
  plan: merchants.plan,
  apiKey: merchants.apiKey,
  youcanStoreId: merchants.youcanStoreId,
  verifyThreshold: merchants.verifyThreshold,
  flagThreshold: merchants.flagThreshold,
  blockThreshold: merchants.blockThreshold,
  autoBlockEnabled: merchants.autoBlockEnabled,
  rtoCostFixed: merchants.rtoCostFixed,
  rtoCostPercent: merchants.rtoCostPercent,
  dataRetentionMonths: merchants.dataRetentionMonths,
  cndpDeclarationRef: merchants.cndpDeclarationRef,
  consentRecordedAt: merchants.consentRecordedAt,
  createdAt: merchants.createdAt,
  updatedAt: merchants.updatedAt,
} as const;

/**
 * GET /api/settings
 * Returns the current merchant's settings.
 */
export async function GET() {
  const merchantId = await getMerchantId();

  const [merchant] = await db
    .select(merchantSelect)
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!merchant) {
    return NextResponse.json(
      { error: "Marchand introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: merchant });
}

/**
 * PUT /api/settings
 * Updates scoring thresholds, auto-block, or RTO cost settings.
 * Creates an audit_log entry (Art. 23).
 */
const scoringSchema = z
  .object({
    verifyThreshold: z.number().int().min(10).max(100),
    flagThreshold: z.number().int().min(10).max(100),
    blockThreshold: z.number().int().min(10).max(100),
    autoBlockEnabled: z.boolean(),
  })
  .refine((d) => d.verifyThreshold < d.flagThreshold, {
    message: "verifyThreshold doit \u00EAtre inf\u00E9rieur \u00E0 flagThreshold",
    path: ["verifyThreshold"],
  })
  .refine((d) => d.flagThreshold < d.blockThreshold, {
    message: "flagThreshold doit \u00EAtre inf\u00E9rieur \u00E0 blockThreshold",
    path: ["flagThreshold"],
  });

const rtoCostsSchema = z.object({
  rtoCostFixed: z.number().int().min(0).max(500),
  rtoCostPercent: z.number().min(0).max(0.5),
});

export async function PUT(request: Request) {
  const merchantId = await getMerchantId();

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON invalide" },
      { status: 400 }
    );
  }

  // Try RTO costs schema first (smaller, no ambiguity)
  const rtoParsed = rtoCostsSchema.safeParse(body);
  if (rtoParsed.success) {
    const data = rtoParsed.data;

    // Fetch current for audit
    const [current] = await db
      .select({
        rtoCostFixed: merchants.rtoCostFixed,
        rtoCostPercent: merchants.rtoCostPercent,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!current) {
      return NextResponse.json(
        { error: "Marchand introuvable" },
        { status: 404 }
      );
    }

    await db
      .update(merchants)
      .set({
        rtoCostFixed: data.rtoCostFixed,
        rtoCostPercent: data.rtoCostPercent,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId));

    await db.insert(auditLogs).values({
      merchantId,
      actor: "merchant",
      action: "settings_change",
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify({ previous: current, new: data }),
    });

    const [updated] = await db
      .select(merchantSelect)
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    return NextResponse.json({ data: updated });
  }

  // Try scoring schema
  const parsed = scoringSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Donn\u00E9es invalides",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  // Fetch current settings for audit log
  const [current] = await db
    .select({
      verifyThreshold: merchants.verifyThreshold,
      flagThreshold: merchants.flagThreshold,
      blockThreshold: merchants.blockThreshold,
      autoBlockEnabled: merchants.autoBlockEnabled,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!current) {
    return NextResponse.json(
      { error: "Marchand introuvable" },
      { status: 404 }
    );
  }

  const data = parsed.data;

  await db
    .update(merchants)
    .set({
      verifyThreshold: data.verifyThreshold,
      flagThreshold: data.flagThreshold,
      blockThreshold: data.blockThreshold,
      autoBlockEnabled: data.autoBlockEnabled,
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, merchantId));

  await db.insert(auditLogs).values({
    merchantId,
    actor: "merchant",
    action: "settings_change",
    targetType: "merchant",
    targetId: String(merchantId),
    details: JSON.stringify({ previous: current, new: data }),
  });

  const [updated] = await db
    .select(merchantSelect)
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  return NextResponse.json({ data: updated });
}
