/**
 * WhatsApp Cloud API — Service wrapper.
 *
 * Sends template messages via Meta's Graph API for order verification.
 *
 * PRIVACY (Loi 09-08, Art. 23):
 * Raw phone numbers are NEVER stored or logged.
 * They are used only for the API call and immediately discarded.
 *
 * Env vars:
 *   WHATSAPP_ACCESS_TOKEN       — Meta Business permanent access token
 *   WHATSAPP_PHONE_NUMBER_ID    — WhatsApp Business phone number ID
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN — Random string for webhook hub.challenge
 *   WHATSAPP_APP_SECRET         — Meta App Secret for webhook signature
 */

import { normalizePhone } from "@/lib/hash";

const WHATSAPP_API_VERSION = "v21.0";

// ═══════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════

/** Check if WhatsApp Cloud API env vars are configured. */
export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

// ═══════════════════════════════════════════════════════════
// Phone formatting
// ═══════════════════════════════════════════════════════════

/**
 * Format a phone number for WhatsApp API.
 * WhatsApp expects E.164 WITHOUT the + prefix: "212661234567"
 * Reuses normalizePhone from hash.ts (returns "+212661234567") and strips the +.
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const normalized = normalizePhone(phone); // "+212661234567"
  return normalized.startsWith("+") ? normalized.slice(1) : normalized;
}

/**
 * Validate that a phone number is a valid Moroccan mobile number.
 * Moroccan mobiles start with +2126 or +2127 followed by 8 digits.
 */
export function isValidMoroccanMobile(phone: string): boolean {
  const formatted = formatPhoneForWhatsApp(phone);
  return /^212[67]\d{8}$/.test(formatted);
}

// ═══════════════════════════════════════════════════════════
// Template message sending
// ═══════════════════════════════════════════════════════════

interface SendTemplateResult {
  success: boolean;
  messageId?: string; // Meta wamid for reply tracking
  error?: string;
}

/**
 * Send a pre-approved WhatsApp template message.
 * Used for business-initiated conversations (verification, confirmation, reminder).
 *
 * PRIVACY: the `phone` param is used for the API call only and NEVER logged or stored.
 */
export async function sendTemplateMessage(
  phone: string,
  templateName: string,
  languageCode: string,
  parameters: string[],
): Promise<SendTemplateResult> {
  if (!isWhatsAppConfigured()) {
    console.log(`[WhatsApp] Not configured — would send template "${templateName}" (skipped)`);
    return { success: false, error: "WhatsApp not configured" };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  const to = formatPhoneForWhatsApp(phone);

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(parameters.length > 0
        ? {
            components: [
              {
                type: "body",
                parameters: parameters.map((p) => ({ type: "text", text: p })),
              },
            ],
          }
        : {}),
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000), // 15s timeout
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const errMsg =
        (errBody as { error?: { message?: string } })?.error?.message ??
        `HTTP ${res.status}`;
      console.error("[WhatsApp] Template send failed:", errMsg);
      return { success: false, error: errMsg };
    }

    const data = (await res.json()) as {
      messages?: { id: string }[];
    };
    const messageId = data?.messages?.[0]?.id; // "wamid.xxxxx"
    console.log("[WhatsApp] Template sent successfully, messageId:", messageId);
    return { success: true, messageId };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[WhatsApp] Template send error:", errMsg);
    return { success: false, error: errMsg };
  }
}

// ═══════════════════════════════════════════════════════════
// Verification-specific helper
// ═══════════════════════════════════════════════════════════

/**
 * Send the order_verification template to a customer.
 * Returns the Meta message ID (wamid) for reply tracking, or null on failure.
 *
 * PRIVACY: `rawPhone` is used for the API call only and NEVER stored.
 */
export async function sendVerificationMessage(
  rawPhone: string,
  customerName: string,
  orderRef: string,
  amount: number,
  locale: string = "fr",
): Promise<string | null> {
  if (!isValidMoroccanMobile(rawPhone)) {
    console.warn("[WhatsApp] Invalid Moroccan mobile — skipping verification");
    return null;
  }

  const templateName =
    locale === "fr" ? "order_verification_fr" : "order_verification_en";
  const languageCode = locale === "fr" ? "fr" : "en";
  const params = [customerName || "Client", orderRef, String(amount)];

  const result = await sendTemplateMessage(
    rawPhone,
    templateName,
    languageCode,
    params,
  );
  return result.success ? (result.messageId ?? null) : null;
}

// ═══════════════════════════════════════════════════════════
// Free-form text (reply window only)
// ═══════════════════════════════════════════════════════════

/**
 * Send a free-form text message.
 * Only works within 24h of the last customer message (Meta policy).
 * Used for clarification replies when customer sends unrecognized text.
 */
export async function sendTextMessage(
  phone: string,
  text: string,
): Promise<boolean> {
  if (!isWhatsAppConfigured()) return false;

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  const to = formatPhoneForWhatsApp(phone);

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
