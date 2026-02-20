import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { generateApiKey } from "@/lib/api-key";
import { requireVerifiedEmail } from "@/lib/email-verification";

/**
 * POST /api/settings/api-key/regenerate
 * Generates a new API key, invalidates the old one.
 * Creates an audit_log entry (Art. 23).
 */
export async function POST() {
  const merchantId = await getMerchantId();

  // Email verification guard
  const verifyCheck = await requireVerifiedEmail(merchantId);
  if (!verifyCheck.allowed) {
    return NextResponse.json(
      { error: verifyCheck.error, code: verifyCheck.code },
      { status: 403 }
    );
  }

  // Fetch current key for audit log
  const [current] = await db
    .select({ apiKey: merchants.apiKey })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!current) {
    return NextResponse.json(
      { error: "Marchand introuvable" },
      { status: 404 }
    );
  }

  // Generate new key
  const newKey = generateApiKey();

  // Update merchant
  await db
    .update(merchants)
    .set({
      apiKey: newKey,
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, merchantId));

  // Art. 23 — Audit log (obligatoire)
  const maskKey = (key: string | null) =>
    key ? key.slice(0, 12) + "••••••••" : "—";

  await db.insert(auditLogs).values({
    merchantId,
    actor: "merchant",
    action: "settings_change",
    targetType: "merchant",
    targetId: String(merchantId),
    details: JSON.stringify({
      field: "apiKey",
      previous: maskKey(current.apiKey),
      new: maskKey(newKey),
    }),
  });

  return NextResponse.json({ data: { apiKey: newKey } });
}
