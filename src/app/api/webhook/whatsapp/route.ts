import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";

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
// TODO: re-enable when whatsapp_verification_status and whatsapp_message_id columns are added to DB
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function processVerificationReply(
  merchantId: number,
  originalMessageId: string,
  replyText: string,
): Promise<void> {
  console.log(
    `[WhatsApp Webhook] Verification reply processing disabled (columns not yet in DB). merchant=${merchantId} msgId=${originalMessageId} reply="${replyText}"`,
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
