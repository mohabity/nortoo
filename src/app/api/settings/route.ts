import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { DEMO_MERCHANT_ID } from "@/lib/merchant";

/**
 * GET /api/settings
 * Returns the current merchant's settings.
 */
export async function GET() {
  const [merchant] = await db
    .select({
      name: merchants.name,
      domain: merchants.domain,
      plan: merchants.plan,
      apiKey: merchants.apiKey,
      verifyThreshold: merchants.verifyThreshold,
      flagThreshold: merchants.flagThreshold,
      blockThreshold: merchants.blockThreshold,
      autoBlockEnabled: merchants.autoBlockEnabled,
      dataRetentionMonths: merchants.dataRetentionMonths,
      cndpDeclarationRef: merchants.cndpDeclarationRef,
      consentRecordedAt: merchants.consentRecordedAt,
    })
    .from(merchants)
    .where(eq(merchants.id, DEMO_MERCHANT_ID))
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
 * Updates scoring thresholds and auto-block setting.
 * Creates an audit_log entry (Art. 23).
 */
const settingsSchema = z
  .object({
    verifyThreshold: z.number().int().min(10).max(100),
    flagThreshold: z.number().int().min(10).max(100),
    blockThreshold: z.number().int().min(10).max(100),
    autoBlockEnabled: z.boolean(),
  })
  .refine((d) => d.verifyThreshold < d.flagThreshold, {
    message: "verifyThreshold doit être inférieur à flagThreshold",
    path: ["verifyThreshold"],
  })
  .refine((d) => d.flagThreshold < d.blockThreshold, {
    message: "flagThreshold doit être inférieur à blockThreshold",
    path: ["flagThreshold"],
  });

export async function PUT(request: Request) {
  // Parse & validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON invalide" },
      { status: 400 }
    );
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Données invalides",
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
    .where(eq(merchants.id, DEMO_MERCHANT_ID))
    .limit(1);

  if (!current) {
    return NextResponse.json(
      { error: "Marchand introuvable" },
      { status: 404 }
    );
  }

  const data = parsed.data;

  // Update merchant settings
  await db
    .update(merchants)
    .set({
      verifyThreshold: data.verifyThreshold,
      flagThreshold: data.flagThreshold,
      blockThreshold: data.blockThreshold,
      autoBlockEnabled: data.autoBlockEnabled,
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, DEMO_MERCHANT_ID));

  // Art. 23 — Audit log (obligatoire)
  await db.insert(auditLogs).values({
    merchantId: DEMO_MERCHANT_ID,
    actor: "merchant",
    action: "settings_change",
    targetType: "merchant",
    targetId: String(DEMO_MERCHANT_ID),
    details: JSON.stringify({
      previous: {
        verifyThreshold: current.verifyThreshold,
        flagThreshold: current.flagThreshold,
        blockThreshold: current.blockThreshold,
        autoBlockEnabled: current.autoBlockEnabled,
      },
      new: data,
    }),
  });

  // Return updated settings
  const [updated] = await db
    .select({
      name: merchants.name,
      domain: merchants.domain,
      plan: merchants.plan,
      apiKey: merchants.apiKey,
      verifyThreshold: merchants.verifyThreshold,
      flagThreshold: merchants.flagThreshold,
      blockThreshold: merchants.blockThreshold,
      autoBlockEnabled: merchants.autoBlockEnabled,
      dataRetentionMonths: merchants.dataRetentionMonths,
      cndpDeclarationRef: merchants.cndpDeclarationRef,
      consentRecordedAt: merchants.consentRecordedAt,
    })
    .from(merchants)
    .where(eq(merchants.id, DEMO_MERCHANT_ID))
    .limit(1);

  return NextResponse.json({ data: updated });
}
