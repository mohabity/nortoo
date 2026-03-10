/**
 * WhatsApp Cloud API — Service wrapper (per-merchant credentials).
 *
 * Each merchant configures their own WhatsApp Business phone number.
 * Credentials (phoneNumberId + accessToken) are stored encrypted in the
 * merchants table using AES-256-GCM (same pattern as YouCan tokens).
 *
 * PRIVACY (Loi 09-08, Art. 23):
 * Raw customer phone numbers are NEVER stored or logged.
 * They are used only for the API call and immediately discarded.
 *
 * Global env vars (Meta App level, not per-merchant):
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN — Random string for webhook hub.challenge
 *   WHATSAPP_APP_SECRET           — Meta App Secret for webhook signature
 */

import { normalizePhone } from "@/lib/hash";
import { decryptSafe } from "@/lib/encryption";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";

const WHATSAPP_API_VERSION = "v21.0";

// ═══════════════════════════════════════════════════════════
// Per-merchant credentials
// ═══════════════════════════════════════════════════════════

export interface WhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
}

/**
 * Load and decrypt WhatsApp credentials for a specific merchant.
 * Returns null if the merchant has not configured WhatsApp.
 */
export async function getMerchantWhatsAppCredentials(
  merchantId: number,
): Promise<WhatsAppCredentials | null> {
  const [m] = await db
    .select({
      phoneNumberId: merchants.whatsappPhoneNumberId,
      accessToken: merchants.whatsappAccessToken,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!m?.phoneNumberId || !m?.accessToken) return null;

  const decryptedToken = decryptSafe(m.accessToken);
  if (!decryptedToken) return null;

  return {
    phoneNumberId: m.phoneNumberId,
    accessToken: decryptedToken,
  };
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
 * Send a pre-approved WhatsApp template message using merchant-specific credentials.
 *
 * PRIVACY: the `phone` param is used for the API call only and NEVER logged or stored.
 */
export async function sendTemplateMessage(
  credentials: WhatsAppCredentials,
  phone: string,
  templateName: string,
  languageCode: string,
  parameters: string[],
): Promise<SendTemplateResult> {
  const to = formatPhoneForWhatsApp(phone);

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${credentials.phoneNumberId}/messages`;

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
        Authorization: `Bearer ${credentials.accessToken}`,
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
  credentials: WhatsAppCredentials,
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
    credentials,
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
 * Send a free-form text message using merchant-specific credentials.
 * Only works within 24h of the last customer message (Meta policy).
 */
export async function sendTextMessage(
  credentials: WhatsAppCredentials,
  phone: string,
  text: string,
): Promise<boolean> {
  const to = formatPhoneForWhatsApp(phone);

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${credentials.phoneNumberId}/messages`;
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
        Authorization: `Bearer ${credentials.accessToken}`,
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
