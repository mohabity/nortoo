import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getMerchantId } from "@/lib/merchant";
import { sendVerificationEmail } from "@/lib/email-verification";
import { auth } from "@/auth";
import { requireActiveBilling } from "@/lib/billing-guard";
import type { Locale } from "@/i18n/types";
import { logProductEvent, EVENTS } from "@/lib/analytics-server";

// ── Shared select columns ──
const merchantSelect = {
  name: merchants.name,
  locale: merchants.locale,
  domain: merchants.domain,
  email: merchants.email,
  emailVerified: merchants.emailVerified,
  plan: merchants.plan,
  apiKey: merchants.apiKey,
  youcanStoreId: merchants.youcanStoreId,
  verifyThreshold: merchants.verifyThreshold,
  flagThreshold: merchants.flagThreshold,
  blockThreshold: merchants.blockThreshold,
  autoBlockEnabled: merchants.autoBlockEnabled,
  escalationConfig: merchants.escalationConfig,
  rtoCostFixed: merchants.rtoCostFixed,
  rtoCostPercent: merchants.rtoCostPercent,
  dataRetentionMonths: merchants.dataRetentionMonths,
  notificationPreferences: merchants.notificationPreferences,
  cndpDeclarationRef: merchants.cndpDeclarationRef,
  consentRecordedAt: merchants.consentRecordedAt,
  trialEndsAt: merchants.trialEndsAt,
  currentMonthOrders: merchants.currentMonthOrders,
  currentMonthStart: merchants.currentMonthStart,
  createdAt: merchants.createdAt,
  updatedAt: merchants.updatedAt,
} as const;

/**
 * GET /api/settings
 * Returns the current merchant's settings.
 */
export async function GET() {
  try {
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
  } catch (error) {
    console.error("[Settings GET] Error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
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

const escalationBracketSchema = z.object({
  high: z.number().int().min(1).max(1440),
  medium: z.number().int().min(1).max(1440),
  low: z.number().int().min(1).max(1440),
  minimal: z.number().int().min(1).max(1440),
});

const escalationConfigSchema = z.object({
  escalationConfig: z.object({
    block: escalationBracketSchema,
    flag: escalationBracketSchema,
    verify: escalationBracketSchema,
  }),
});

export async function PUT(request: Request) {
  const merchantId = await getMerchantId();

  // Paywall check — block mutations when billing inactive
  const billing = await requireActiveBilling(merchantId);
  if (billing.blocked) {
    return NextResponse.json(billing.response, { status: billing.status });
  }

  // Get userId from session for audit log enrichment
  let userId: number | undefined;
  try {
    const session = await auth();
    userId = session?.user?.userId;
  } catch { /* non-critical */ }

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

  // Try profile schema first
  const profileSchema = z.object({
    _type: z.literal("profile"),
    name: z.string().min(2).max(100),
    email: z.string().email(),
  });
  const profileParsed = profileSchema.safeParse(body);
  if (profileParsed.success) {
    const data = profileParsed.data;
    const normalizedEmail = data.email.trim().toLowerCase();

    const [current] = await db
      .select({
        name: merchants.name,
        email: merchants.email,
        emailVerified: merchants.emailVerified,
        locale: merchants.locale,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!current) {
      return NextResponse.json({ error: "Marchand introuvable" }, { status: 404 });
    }

    // Check if new email already taken by another merchant
    if (normalizedEmail !== current.email) {
      const [existing] = await db
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.email, normalizedEmail))
        .limit(1);

      if (existing) {
        return NextResponse.json(
          { error: "Un compte avec cet email existe d\u00e9j\u00e0" },
          { status: 409 }
        );
      }
    }

    const emailChanged = normalizedEmail !== current.email;

    await db
      .update(merchants)
      .set({
        name: data.name.trim(),
        email: normalizedEmail,
        emailVerified: emailChanged ? null : undefined, // reset if email changed
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId));

    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "settings_change",
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify({
        field: "profile",
        previous: { name: current.name, email: current.email },
        new: { name: data.name.trim(), email: normalizedEmail },
        emailChanged,
      }),
    });

    // If email changed, send verification to the new email
    if (emailChanged) {
      const locale = (current.locale ?? "fr") as Locale;
      sendVerificationEmail(merchantId, normalizedEmail, locale).catch(() => {});
    }

    const [updated] = await db
      .select(merchantSelect)
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    return NextResponse.json({
      data: updated,
      emailChanged,
    });
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
      userId,
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

  // Try notification preferences schema
  const notifEmailSchema = z.object({
    order_auto_blocked: z.boolean(),
    order_needs_review: z.boolean(),
    order_flagged: z.boolean(),
    escalation: z.boolean(),
    daily_summary: z.boolean(),
    weekly_report: z.boolean(),
    webhook_failed: z.boolean(),
  });
  const notifPrefsSchema = z.object({
    _type: z.literal("notifications"),
    notificationPreferences: z.object({ email: notifEmailSchema }),
  });
  const notifPrefsParsed = notifPrefsSchema.safeParse(body);
  if (notifPrefsParsed.success) {
    const data = notifPrefsParsed.data;
    const prefsJson = JSON.stringify(data.notificationPreferences);

    const [current] = await db
      .select({ notificationPreferences: merchants.notificationPreferences })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    await db
      .update(merchants)
      .set({ notificationPreferences: prefsJson, updatedAt: new Date() })
      .where(eq(merchants.id, merchantId));

    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "settings_change",
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify({
        field: "notificationPreferences",
        previous: current?.notificationPreferences,
        new: prefsJson,
      }),
    });

    const [updated] = await db
      .select(merchantSelect)
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    return NextResponse.json({ data: updated });
  }

  // Try retention schema
  const retentionSchema = z.object({
    _type: z.literal("retention"),
    dataRetentionMonths: z.number().int().min(6).max(60),
  });
  const retentionParsed = retentionSchema.safeParse(body);
  if (retentionParsed.success) {
    const data = retentionParsed.data;

    const [current] = await db
      .select({ dataRetentionMonths: merchants.dataRetentionMonths })
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
        dataRetentionMonths: data.dataRetentionMonths,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId));

    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "settings_change",
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify({
        field: "dataRetentionMonths",
        previous: current.dataRetentionMonths,
        new: data.dataRetentionMonths,
      }),
    });

    const [updated] = await db
      .select(merchantSelect)
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    return NextResponse.json({ data: updated });
  }

  // Try escalation config schema
  const escalationParsed = escalationConfigSchema.safeParse(body);
  if (escalationParsed.success) {
    const configJson = JSON.stringify(escalationParsed.data.escalationConfig);

    const [currentEsc] = await db
      .select({ escalationConfig: merchants.escalationConfig })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!currentEsc) {
      return NextResponse.json(
        { error: "Marchand introuvable" },
        { status: 404 }
      );
    }

    await db
      .update(merchants)
      .set({ escalationConfig: configJson, updatedAt: new Date() })
      .where(eq(merchants.id, merchantId));

    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "settings_change",
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify({
        field: "escalationConfig",
        previous: currentEsc.escalationConfig,
        new: configJson,
      }),
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

  // Analytics — fire-and-forget
  logProductEvent(merchantId, EVENTS.SCORING_CONFIG_CHANGED, {
    previous: current,
    new: data,
  }, userId);

  const [updated] = await db
    .select(merchantSelect)
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  return NextResponse.json({ data: updated });
}
