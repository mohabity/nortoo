import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getMerchantId } from "@/lib/merchant";
import { requireActiveBilling } from "@/lib/billing-guard";
import { encrypt } from "@/lib/encryption";
import { auth } from "@/auth";

// ── Zod schema ──
const embeddedSignupSchema = z.object({
  code: z.string().min(1).max(2000),
  phoneNumberId: z.string().min(1).max(100),
  wabaId: z.string().min(1).max(100),
});

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * POST /api/auth/whatsapp-embedded
 *
 * Handles the Meta Embedded Signup callback:
 * 1. Exchanges authorization code for access token
 * 2. Subscribes app to the WABA
 * 3. Registers the phone number
 * 4. Stores encrypted credentials
 */
export async function POST(request: Request) {
  try {
    // 1. Auth — merchant must be logged in
    const merchantId = await getMerchantId();

    // 2. Billing — paywall check
    const billing = await requireActiveBilling(merchantId);
    if (billing.blocked) {
      return NextResponse.json(billing.response, { status: billing.status });
    }

    // 3. Get userId for audit log
    let userId: number | undefined;
    try {
      const session = await auth();
      userId = session?.user?.userId;
    } catch { /* non-critical */ }

    // 4. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = embeddedSignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { code, phoneNumberId, wabaId } = parsed.data;

    // 5. Exchange code → access token via Meta Graph API
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      console.error("[WhatsApp Embedded] Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET");
      return NextResponse.json(
        { error: "Configuration Meta manquante" },
        { status: 500 },
      );
    }

    const tokenUrl = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString(), { method: "GET" });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[WhatsApp Embedded] Token exchange failed:", tokenData);
      return NextResponse.json(
        { error: "Échange de code échoué. Réessayez." },
        { status: 400 },
      );
    }

    const accessToken: string = tokenData.access_token;

    // 6. Subscribe app to the WABA (non-blocking — log errors but continue)
    try {
      const subscribeRes = await fetch(
        `${GRAPH_API_BASE}/${wabaId}/subscribed_apps`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!subscribeRes.ok) {
        const err = await subscribeRes.json().catch(() => ({}));
        console.warn("[WhatsApp Embedded] WABA subscription warning:", err);
      }
    } catch (err) {
      console.warn("[WhatsApp Embedded] WABA subscription error:", err);
    }

    // 7. Register phone number (non-blocking — may already be registered)
    try {
      const registerRes = await fetch(
        `${GRAPH_API_BASE}/${phoneNumberId}/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            pin: "000000",
          }),
        },
      );
      if (!registerRes.ok) {
        const err = await registerRes.json().catch(() => ({}));
        console.warn("[WhatsApp Embedded] Phone registration warning:", err);
      }
    } catch (err) {
      console.warn("[WhatsApp Embedded] Phone registration error:", err);
    }

    // 8. Store encrypted credentials
    const [current] = await db
      .select({ whatsappPhoneNumberId: merchants.whatsappPhoneNumberId })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    await db
      .update(merchants)
      .set({
        whatsappPhoneNumberId: phoneNumberId,
        whatsappAccessToken: encrypt(accessToken),
        whatsappWabaId: wabaId,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId));

    // 9. Audit log (Art. 23)
    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "whatsapp_embedded_signup",
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify({
        field: "whatsapp_credentials",
        method: "embedded_signup",
        previous: current?.whatsappPhoneNumberId
          ? `***${current.whatsappPhoneNumberId.slice(-4)}`
          : null,
        new: `***${phoneNumberId.slice(-4)}`,
        wabaId: `***${wabaId.slice(-4)}`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WhatsApp Embedded] Error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 },
    );
  }
}
