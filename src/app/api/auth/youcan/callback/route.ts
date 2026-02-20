import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateApiKey } from "@/lib/api-key";

/**
 * GET /api/auth/youcan/callback
 *
 * YouCan OAuth callback:
 * 1. Verify CSRF state
 * 2. Exchange code for access_token
 * 3. Fetch store info from /me
 * 4. Upsert merchant in DB
 * 5. Subscribe to order.create webhook
 * 6. Set auth cookie + redirect to dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // ── Handle OAuth error from YouCan ──
  if (error) {
    return NextResponse.redirect(
      `${appUrl}/onboarding?error=${encodeURIComponent("YouCan a refusé l'autorisation: " + error)}`
    );
  }

  // ── Validate code ──
  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/onboarding?error=${encodeURIComponent("Code d'autorisation manquant")}`
    );
  }

  // ── Verify CSRF state ──
  const savedState = request.cookies.get("oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      `${appUrl}/onboarding?error=${encodeURIComponent("Erreur de sécurité (state CSRF invalide). Réessayez.")}`
    );
  }

  const clientId = process.env.YOUCAN_CLIENT_ID!;
  const clientSecret = process.env.YOUCAN_CLIENT_SECRET!;
  const redirectUri = process.env.YOUCAN_REDIRECT_URI!;

  try {
    // ── 1. Exchange code for access_token ──
    const tokenRes = await fetch("https://api.youcan.shop/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[YouCan OAuth] Token exchange failed:", errText);
      return NextResponse.redirect(
        `${appUrl}/onboarding?error=${encodeURIComponent("Échec de l'échange du token. Réessayez.")}`
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        `${appUrl}/onboarding?error=${encodeURIComponent("Token d'accès manquant dans la réponse YouCan.")}`
      );
    }

    // ── 2. Fetch store info ──
    const meRes = await fetch("https://api.youcan.shop/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meRes.ok) {
      console.error("[YouCan OAuth] /me failed:", await meRes.text());
      return NextResponse.redirect(
        `${appUrl}/onboarding?error=${encodeURIComponent("Impossible de récupérer les informations de votre boutique.")}`
      );
    }

    const storeInfo = await meRes.json();
    const storeId: string = storeInfo.id;
    const storeName: string = storeInfo.name || storeInfo.store_name || "Ma boutique";
    const storeEmail: string = storeInfo.email || "";
    const storeDomain: string = storeInfo.domain || storeInfo.slug || "";

    if (!storeId) {
      return NextResponse.redirect(
        `${appUrl}/onboarding?error=${encodeURIComponent("ID boutique manquant dans la réponse YouCan.")}`
      );
    }

    // ── 3. Upsert merchant ──
    const [existingMerchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.youcanStoreId, storeId))
      .limit(1);

    let merchantId: number;
    let apiKey: string;

    if (existingMerchant) {
      // Update existing merchant with new token
      merchantId = existingMerchant.id;
      apiKey = existingMerchant.apiKey!;

      await db
        .update(merchants)
        .set({
          youcanAccessToken: accessToken,
          name: storeName,
          email: storeEmail || existingMerchant.email,
          domain: storeDomain || existingMerchant.domain,
          updatedAt: new Date(),
        })
        .where(eq(merchants.id, merchantId));
    } else {
      // Create new merchant
      apiKey = generateApiKey();

      const [newMerchant] = await db
        .insert(merchants)
        .values({
          name: storeName,
          email: storeEmail || "unknown@youcan.shop",
          domain: storeDomain,
          youcanStoreId: storeId,
          youcanAccessToken: accessToken,
          apiKey,
          plan: "trial",
          consentRecordedAt: new Date(),
        })
        .returning({ id: merchants.id });

      merchantId = newMerchant.id;
    }

    // ── 4. Subscribe to order.create webhook on YouCan ──
    // YouCan REST Hooks API: POST /resthooks/subscribe with target_url + event
    const webhookUrl = `${appUrl}/api/webhook/youcan?key=${apiKey}`;
    let webhookOk = false;

    try {
      const webhookRes = await fetch("https://api.youcan.shop/resthooks/subscribe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_url: webhookUrl,
          event: "order.create",
        }),
      });

      if (webhookRes.ok) {
        webhookOk = true;
      } else {
        // Log but don't fail — merchant can configure manually
        console.error(
          "[YouCan OAuth] Webhook subscription failed:",
          await webhookRes.text()
        );
      }
    } catch (webhookErr) {
      console.error("[YouCan OAuth] Webhook subscription error:", webhookErr);
    }

    // ── 5. Audit log (Art. 23) ──
    await db.insert(auditLogs).values({
      merchantId,
      actor: "system",
      action: "youcan_connect",
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify({
        storeId,
        storeName,
        storeDomain,
        isNewMerchant: !existingMerchant,
        webhookConfigured: webhookOk,
      }),
    });

    // ── 6. Set auth cookie + redirect ──
    const response = NextResponse.redirect(`${appUrl}/dashboard?connected=true`);

    response.cookies.set("codpilot_merchant", String(merchantId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Clear the OAuth state cookie
    response.cookies.delete("oauth_state");

    return response;
  } catch (err) {
    console.error("[YouCan OAuth] Unexpected error:", err);
    return NextResponse.redirect(
      `${appUrl}/onboarding?error=${encodeURIComponent("Erreur inattendue. Veuillez réessayer.")}`
    );
  }
}
