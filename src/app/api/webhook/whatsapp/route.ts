import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/db/index";
import { orders, notifications, auditLogs, merchants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { shouldNotify } from "@/lib/notification-helper";

// ═══════════════════════════════════════════════════════════
// GET /api/webhook/whatsapp
// Meta webhook verification (hub.challenge).
// Called once when registering the webhook URL in Meta Business Manager.
// ═══════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    console.error("[WhatsApp Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN not set");
    return new Response("Configuration error", { status: 500 });
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Verification successful");
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// ═══════════════════════════════════════════════════════════
// POST /api/webhook/whatsapp
// Receives incoming WhatsApp messages from Meta.
// Parses customer replies (OUI/NON) to verification messages.
// ═══════════════════════════════════════════════════════════

// Reply matching patterns (FR + EN + numeric)
const YES_PATTERNS = /^(oui|yes|1|ok|confirm|confirmer|d'accord|daccord)$/i;
const NO_PATTERNS = /^(non|no|2|annul|annuler|cancel|refus|refuser)$/i;

export async function POST(request: Request) {
  try {
    // ── 1. Read raw body for signature verification ──
    const rawBody = await request.text();

    // ── 2. Verify X-Hub-Signature-256 (if app secret configured) ──
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (appSecret) {
      const signature = request.headers.get("x-hub-signature-256");
      if (!signature) {
        console.error("[WhatsApp Webhook] Missing signature header");
        return NextResponse.json({ error: "Missing signature" }, { status: 403 });
      }

      const expectedSig =
        "sha256=" +
        createHmac("sha256", appSecret).update(rawBody).digest("hex");

      if (signature !== expectedSig) {
        console.error("[WhatsApp Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    // ── 3. Parse payload ──
    const payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;

    // Meta sends status updates and messages — we only care about messages
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      // Status update or other non-message event — acknowledge silently
      return NextResponse.json({ received: true });
    }

    // ── 4. Identify merchant by phone_number_id (tenant routing) ──
    const phoneNumberId = value?.metadata?.phone_number_id;
    if (!phoneNumberId) {
      return NextResponse.json({ received: true });
    }

    const [merchant] = await db
      .select({ id: merchants.id })
      .from(merchants)
      .where(eq(merchants.whatsappPhoneNumberId, phoneNumberId))
      .limit(1);

    if (!merchant) {
      console.warn("[WhatsApp Webhook] Unknown phone_number_id:", phoneNumberId);
      return NextResponse.json({ received: true });
    }

    // ── 5. Process each incoming message ──
    for (const message of messages) {
      // We only handle text replies for verification
      if (message.type !== "text") continue;

      const text = message.text?.body?.trim();
      const contextMessageId = message.context?.id; // wamid of original message

      if (!text || !contextMessageId) continue;

      await processVerificationReply(merchant.id, contextMessageId, text);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    // Always return 200 to Meta to prevent retries on our processing errors
    return NextResponse.json({ received: true });
  }
}

// ═══════════════════════════════════════════════════════════
// Reply processing
// ═══════════════════════════════════════════════════════════

/**
 * Process a customer reply to a verification WhatsApp message.
 * Matches by whatsappMessageId + merchantId (tenant isolation) → updates order.
 */
async function processVerificationReply(
  merchantId: number,
  originalMessageId: string,
  replyText: string,
): Promise<void> {
  // Find the order by WhatsApp message ID + tenant isolation
  const [order] = await db
    .select({
      id: orders.id,
      merchantId: orders.merchantId,
      externalRef: orders.externalRef,
      decision: orders.decision,
      whatsappVerificationStatus: orders.whatsappVerificationStatus,
    })
    .from(orders)
    .where(
      and(
        eq(orders.whatsappMessageId, originalMessageId),
        eq(orders.merchantId, merchantId),
      ),
    )
    .limit(1);

  if (!order) {
    console.warn(
      "[WhatsApp Webhook] No order found for messageId:",
      originalMessageId,
    );
    return;
  }

  // Skip if already processed (idempotent)
  if (
    order.whatsappVerificationStatus === "confirmed" ||
    order.whatsappVerificationStatus === "rejected"
  ) {
    return;
  }

  const isYes = YES_PATTERNS.test(replyText);
  const isNo = NO_PATTERNS.test(replyText);

  if (!isYes && !isNo) {
    // Unrecognized reply — log and let escalation cron handle expiry.
    // We cannot send a clarification message because we don't have
    // the raw phone number (it was discarded after ingestion).
    console.log(
      `[WhatsApp Webhook] Unrecognized reply for order ${order.id}: "${replyText}"`,
    );
    return;
  }

  const now = new Date();
  const newDecision = isYes ? "ship" : "block";
  const newStatus = isYes ? "confirmed" : "rejected";
  const pipelineStatus = isYes ? "auto_shipped" : "auto_blocked";

  // ── Update order (same override pattern as /api/orders/[id]/override) ──
  await db
    .update(orders)
    .set({
      decision: newDecision,
      whatsappVerificationStatus: newStatus,
      overrideDecision: newDecision,
      overrideBy: "whatsapp_customer",
      overrideReason: isYes
        ? `Client confirmé via WhatsApp: "${replyText}"`
        : `Client refusé via WhatsApp: "${replyText}"`,
      overrideAt: now,
      pipelineStatus,
    })
    .where(eq(orders.id, order.id));

  // ── Auto-mark related notifications as read ──
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.merchantId, order.merchantId),
        eq(notifications.orderId, order.id),
        eq(notifications.read, false),
      ),
    );

  // ── Audit log (Art. 23 — obligatoire) ──
  await db.insert(auditLogs).values({
    merchantId: order.merchantId,
    actor: "consumer",
    action: "whatsapp_verification",
    targetType: "order",
    targetId: String(order.id),
    details: JSON.stringify({
      previousDecision: order.decision,
      newDecision,
      whatsappReply: replyText,
      verificationStatus: newStatus,
    }),
  });

  // ── Notify merchant ──
  const ref = order.externalRef ?? `#${order.id}`;
  const notifType = isYes ? "order_auto_shipped" : "order_auto_blocked";

  if (await shouldNotify(order.merchantId, notifType)) {
    await db.insert(notifications).values({
      merchantId: order.merchantId,
      orderId: order.id,
      type: notifType,
      title: isYes
        ? `Commande ${ref} confirmée via WhatsApp`
        : `Commande ${ref} refusée via WhatsApp`,
      message: isYes
        ? `Le client a confirmé la commande. Expédition automatique.`
        : `Le client a refusé la commande. Blocage automatique.`,
      severity: isYes ? "info" : "warning",
      actionUrl: `/dashboard/orders?selected=${order.id}`,
    });
  }

  console.log(
    `[WhatsApp Webhook] Order ${order.id} → ${newDecision} (customer replied: "${replyText}")`,
  );
}

// ═══════════════════════════════════════════════════════════
// Meta webhook payload types
// ═══════════════════════════════════════════════════════════

interface WhatsAppWebhookPayload {
  object?: string;
  entry?: {
    id: string;
    changes?: {
      value?: {
        messaging_product?: string;
        metadata?: { display_phone_number?: string; phone_number_id?: string };
        messages?: WhatsAppMessage[];
        statuses?: unknown[];
      };
      field?: string;
    }[];
  }[];
}

interface WhatsAppMessage {
  from: string; // sender phone e.g. "212661234567"
  id: string; // message ID
  timestamp: string;
  type: string; // "text" | "image" | "audio" | etc.
  text?: { body: string };
  context?: {
    from: string;
    id: string; // wamid of message being replied to
  };
}
