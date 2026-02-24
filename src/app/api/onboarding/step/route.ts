import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { z } from "zod";

const stepSchema = z.object({
  step: z.number().int().min(1).max(6),
  data: z
    .object({
      preset: z.enum(["permissive", "balanced", "conservative"]).optional(),
      consent: z.boolean().optional(),
    })
    .optional(),
});

const PRESETS: Record<string, { verify: number; flag: number; block: number }> = {
  permissive: { verify: 45, flag: 80, block: 95 },
  balanced: { verify: 31, flag: 66, block: 86 },
  conservative: { verify: 25, flag: 55, block: 75 },
};

/**
 * PUT /api/onboarding/step
 * Updates the merchant's onboarding progress.
 * If step-specific data is provided (e.g. preset), applies it.
 */
export async function PUT(request: NextRequest) {
  const merchantId = await getMerchantId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const parsed = stepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { step, data } = parsed.data;

  // Build update object
  const updates: Record<string, unknown> = {
    onboardingStep: step,
    updatedAt: new Date(),
  };

  // Step 1: record consent (Loi 09-08 Art. 5)
  if (step === 1 && data?.consent === true) {
    updates.consentRecordedAt = new Date();
  }

  // Step 3: apply scoring preset
  if (step === 3 && data?.preset) {
    const preset = PRESETS[data.preset];
    if (preset) {
      updates.verifyThreshold = preset.verify;
      updates.flagThreshold = preset.flag;
      updates.blockThreshold = preset.block;
    }
  }

  // Step 6: mark onboarding as completed
  if (step >= 6) {
    updates.onboardingCompletedAt = new Date();
    updates.onboardingStep = 6;
  }

  await db
    .update(merchants)
    .set(updates)
    .where(eq(merchants.id, merchantId));

  // Audit log
  await db.insert(auditLogs).values({
    merchantId,
    actor: "merchant",
    action: "onboarding_step",
    targetType: "merchant",
    targetId: String(merchantId),
    details: JSON.stringify({ step, data: data ?? null }),
  });

  return NextResponse.json({
    data: { success: true, step, nextStep: Math.min(step + 1, 6) },
  });
}
