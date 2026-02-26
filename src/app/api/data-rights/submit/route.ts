import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { customers, dataRightsRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPhone } from "@/lib/hash";
import { sendEmail, buildDataRightsConfirmationEmail, buildDataRightsNotificationEmail } from "@/lib/email";
import { authLimiter, getClientIp, isRateLimitConfigured } from "@/lib/rate-limit";
import { logProductEvent, EVENTS } from "@/lib/analytics-server";

/**
 * POST /api/data-rights/submit
 * Public endpoint (no auth required) for end consumers to exercise
 * their data rights under Loi 09-08 (Art. 7-9).
 *
 * Receives the request, stores it in DB, and sends:
 * 1. Confirmation email to the requester
 * 2. Notification email to support@nortoo.ma
 */

const submitSchema = z.object({
  type: z.enum(["access", "rectification", "deletion"]),
  phone: z.string().min(8).max(20),
  email: z.string().email().max(255),
  details: z.string().max(1000).optional(),
});

/** Calculate deadline: 10 business days from now */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++; // skip weekends
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit by IP (5 req/hour) ──
    if (isRateLimitConfigured()) {
      const ip = getClientIp(request);
      const { success, reset } = await authLimiter.limit(`data-rights:${ip}`);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Trop de demandes. Réessayez dans quelques minutes." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    }

    // ── Parse & validate body ──
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { type, phone, email, details } = parsed.data;

    // ── Hash the phone number (never stored in clear) ──
    const phoneHash = hashPhone(phone);

    // ── Find merchant(s) that have orders for this phone hash ──
    // We look up which merchant has a customer with this phoneHash
    const matchingCustomers = await db
      .select({ merchantId: customers.merchantId })
      .from(customers)
      .where(eq(customers.phoneHash, phoneHash))
      .limit(10);

    // Generate unique reference
    const reference = `DR-${Date.now().toString(36).toUpperCase()}`;
    const deadline = addBusinessDays(new Date(), 10);

    // ── Insert data rights request(s) ──
    if (matchingCustomers.length > 0) {
      // Create a request per merchant that holds data
      const insertValues = matchingCustomers.map((c) => ({
        merchantId: c.merchantId,
        requesterPhoneHash: phoneHash,
        rightType: type,
        status: "pending" as const,
        responseDeadline: deadline,
      }));

      await db.insert(dataRightsRequests).values(insertValues);
    } else {
      // Even if no customer found, record the request (with merchantId = null)
      // This is important for compliance — we must prove we processed the request
      await db.insert(dataRightsRequests).values({
        merchantId: null,
        requesterPhoneHash: phoneHash,
        rightType: type,
        status: "completed" as const,
        responseDeadline: deadline,
        completedAt: new Date(),
      });
    }

    // ── Send confirmation email to requester ──
    const typeLabels: Record<string, string> = {
      access: "Droit d'acc\u00e8s (Art. 7)",
      rectification: "Droit de rectification (Art. 8)",
      deletion: "Droit de suppression (Art. 9)",
    };

    const deadlineStr = deadline.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const confirmEmail = await buildDataRightsConfirmationEmail({
      reference,
      typeLabel: typeLabels[type],
      deadline: deadlineStr,
    });

    const notifEmail = await buildDataRightsNotificationEmail({
      reference,
      typeLabel: typeLabels[type],
      phoneHashPartial: phoneHash.slice(0, 12) + "...",
      requesterEmail: email,
      details: details || null,
      deadline: deadlineStr,
      merchantCount: matchingCustomers.length,
    });

    // Send both emails in parallel
    await Promise.all([
      sendEmail({
        to: email,
        subject: confirmEmail.subject,
        html: confirmEmail.html,
        text: confirmEmail.text,
      }),
      sendEmail({
        to: process.env.SUPPORT_EMAIL || "support@nortoo.ma",
        subject: notifEmail.subject,
        html: notifEmail.html,
        text: notifEmail.text,
      }),
    ]);

    // Analytics — fire-and-forget (use first merchant if available)
    const firstMerchantId = matchingCustomers[0]?.merchantId;
    if (firstMerchantId) {
      logProductEvent(firstMerchantId, EVENTS.DATA_RIGHTS_REQUEST, {
        type,
        merchantCount: matchingCustomers.length,
      });
    }

    return NextResponse.json({
      success: true,
      reference,
      deadline: deadline.toISOString(),
      deadlineFormatted: deadlineStr,
    });
  } catch (err) {
    console.error("[data-rights:submit]", err);
    return NextResponse.json(
      { error: "Une erreur est survenue. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
