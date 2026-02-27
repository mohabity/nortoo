import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, users, auditLogs, inviteLinks } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { generateApiKey } from "@/lib/api-key";
import { encode } from "next-auth/jwt";
import { hash } from "bcryptjs";
import { randomBytes, timingSafeEqual } from "crypto";
import { encrypt } from "@/lib/encryption";
import { getAppUrl } from "@/lib/env";

/** Constant-time string comparison to prevent timing attacks on CSRF tokens. */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

/**
 * GET /api/auth/youcan/callback
 *
 * YouCan OAuth callback — 3-case merchant resolution:
 * A) youcanStoreId match → reconnect (update token)
 * B) Email match (no storeId) → link YouCan store to existing account
 * C) No match → auto-create merchant account
 *
 * All cases create a proper Auth.js JWT session via manual encoding.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = getAppUrl();
  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(msg)}`);

  // ── Handle OAuth error from YouCan ──
  if (error) {
    return errorRedirect("YouCan a refusé l'autorisation: " + error);
  }

  if (!code) {
    return errorRedirect("Code d'autorisation manquant");
  }

  // ── Parse state cookie (JSON with csrf + mode + invite) ──
  const savedStateRaw = request.cookies.get("oauth_state")?.value;
  let savedCsrf = "";
  let mode = "login";
  let inviteCode = "";

  try {
    const parsed = JSON.parse(savedStateRaw || "{}");
    savedCsrf = parsed.csrf || "";
    mode = parsed.mode || "login";
    inviteCode = parsed.invite || "";
  } catch {
    // Backward compat: plain string state cookie
    savedCsrf = savedStateRaw || "";
  }

  if (!savedCsrf || !state || !safeCompare(savedCsrf, state)) {
    return errorRedirect("Erreur de sécurité (state CSRF invalide). Réessayez.");
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
      return errorRedirect("Échec de l'échange du token. Réessayez.");
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    if (!accessToken) {
      return errorRedirect("Token d'accès manquant dans la réponse YouCan.");
    }

    // ── 2. Fetch store info ──
    const meRes = await fetch("https://api.youcan.shop/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meRes.ok) {
      console.error("[YouCan OAuth] /me failed:", await meRes.text());
      return errorRedirect("Impossible de récupérer les informations de votre boutique.");
    }

    const storeInfo = await meRes.json();
    const storeId: string = storeInfo.id;
    const storeName: string = storeInfo.name || storeInfo.store_name || "Ma boutique";
    const storeEmail: string = storeInfo.email || "";
    const storeDomain: string = storeInfo.domain || storeInfo.slug || "";

    if (!storeId) {
      return errorRedirect("ID boutique manquant dans la réponse YouCan.");
    }

    // ── 3. Three-case merchant resolution ──
    let merchantId: number;
    let merchantName: string;
    let merchantEmail: string;
    let merchantPlan: string;
    let apiKey: string;
    let redirectParam: string;
    let auditAction: string;

    // Case A: Find by youcanStoreId (reconnect)
    const [existingByStore] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.youcanStoreId, storeId))
      .limit(1);

    if (existingByStore) {
      // RECONNECT: Update token
      merchantId = existingByStore.id;
      merchantName = existingByStore.name;
      merchantEmail = existingByStore.email;
      merchantPlan = existingByStore.plan;
      apiKey = existingByStore.apiKey!;

      await db
        .update(merchants)
        .set({
          youcanAccessToken: encrypt(accessToken),
          youcanStoreName: storeName,
          name: storeName || existingByStore.name,
          email: storeEmail || existingByStore.email,
          domain: storeDomain || existingByStore.domain,
          emailVerified: existingByStore.emailVerified ?? new Date(), // YouCan verified
          updatedAt: new Date(),
        })
        .where(eq(merchants.id, merchantId));

      redirectParam = "connected=true";
      auditAction = "youcan_reconnect";
    } else if (storeEmail) {
      // Case B: Find by email (link store to existing account)
      const [existingByEmail] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.email, storeEmail))
        .limit(1);

      if (existingByEmail) {
        merchantId = existingByEmail.id;
        merchantName = existingByEmail.name;
        merchantEmail = existingByEmail.email;
        merchantPlan = existingByEmail.plan;
        apiKey = existingByEmail.apiKey!;

        await db
          .update(merchants)
          .set({
            youcanStoreId: storeId,
            youcanAccessToken: encrypt(accessToken),
            youcanStoreName: storeName,
            domain: storeDomain || existingByEmail.domain,
            emailVerified: existingByEmail.emailVerified ?? new Date(), // YouCan verified
            consentRecordedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(merchants.id, merchantId));

        redirectParam = "connected=true";
        auditAction = "youcan_link";
      } else {
        // Case C: No match — auto-create
        const result = await autoCreateMerchant({
          storeName, storeEmail, storeDomain, storeId, accessToken, inviteCode,
        });
        merchantId = result.merchantId;
        merchantName = result.merchantName;
        merchantEmail = result.merchantEmail;
        merchantPlan = result.merchantPlan;
        apiKey = result.apiKey;
        redirectParam = "welcome=true";
        auditAction = "youcan_register";
      }
    } else {
      // No email from YouCan — go straight to auto-create
      const result = await autoCreateMerchant({
        storeName, storeEmail, storeDomain, storeId, accessToken, inviteCode,
      });
      merchantId = result.merchantId;
      merchantName = result.merchantName;
      merchantEmail = result.merchantEmail;
      merchantPlan = result.merchantPlan;
      apiKey = result.apiKey;
      redirectParam = "welcome=true";
      auditAction = "youcan_register";
    }

    // ── 4. Cleanup + Subscribe to order.create webhook ──
    // YouCan allows max 3 subscriptions per store, 1 per event type.
    // We cleanup first to avoid stale/invalid subscriptions, then re-subscribe.
    const webhookUrl = `${appUrl}/api/webhook/youcan?key=${apiKey}`;
    let webhookOk = false;

    try {
      // Step 4a: List existing webhooks and remove them all
      try {
        const listRes = await fetch("https://api.youcan.shop/resthooks/list", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (listRes.ok) {
          const hooks: Array<{ id: string; event: string }> = await listRes.json();
          for (const hook of hooks) {
            try {
              await fetch(`https://api.youcan.shop/resthooks/unsubscribe/${hook.id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
              });
            } catch {
              // Non-critical — continue cleanup
            }
          }
        }
      } catch {
        // List/cleanup failed — still try to subscribe
        console.warn("[YouCan OAuth] Webhook cleanup failed, proceeding with subscribe");
      }

      // Step 4b: Subscribe to order.create (the only valid order event per YouCan docs)
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
        console.error("[YouCan OAuth] Webhook subscription failed:", await webhookRes.text());
      }
    } catch (webhookErr) {
      console.error("[YouCan OAuth] Webhook subscription error:", webhookErr);
    }

    // ── 5. Track invite usage ──
    if (inviteCode && auditAction !== "youcan_reconnect") {
      try {
        await db
          .update(inviteLinks)
          .set({
            currentUses: sql`${inviteLinks.currentUses} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(inviteLinks.code, inviteCode));
      } catch {
        // Non-critical — don't fail the flow
      }
    }

    // ── 6. Audit log (Art. 23) ──
    await db.insert(auditLogs).values({
      merchantId,
      actor: "system",
      action: auditAction,
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify({
        storeId,
        storeName,
        storeDomain,
        mode,
        inviteCode: inviteCode || null,
        webhookConfigured: webhookOk,
      }),
    });

    // ── 7. Ensure user row exists (multi-user support) ──
    let userId: number;
    let userRole = "admin";

    const [existingUser] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(
        and(
          eq(users.merchantId, merchantId),
          eq(users.email, merchantEmail)
        )
      )
      .limit(1);

    if (existingUser) {
      userId = existingUser.id;
      userRole = existingUser.role;
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId));
    } else {
      // Auto-create admin user for this merchant (YouCan OAuth)
      const [newUser] = await db
        .insert(users)
        .values({
          merchantId,
          email: merchantEmail,
          name: merchantName,
          role: "admin",
          status: "active",
          lastLoginAt: new Date(),
        })
        .returning({ id: users.id });
      userId = newUser.id;
    }

    // ── 8. Create Auth.js JWT session + set cookies ──
    const isSecure = process.env.NODE_ENV === "production";
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
    const maxAge = 30 * 24 * 60 * 60; // 30 days

    const sessionToken = await encode({
      salt: cookieName,
      secret: process.env.AUTH_SECRET!,
      token: {
        sub: String(userId),
        name: merchantName,
        email: merchantEmail,
        userId,
        merchantId,
        role: userRole,
        plan: merchantPlan,
      },
      maxAge,
    });

    // New accounts go to onboarding; reconnects go to dashboard
    const redirectUrl =
      redirectParam === "welcome=true"
        ? `${appUrl}/onboarding?step=3&connected=true`
        : `${appUrl}/dashboard?${redirectParam}`;
    const response = NextResponse.redirect(redirectUrl);

    // Auth.js session cookie
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // Legacy cookie (backward compat with middleware)
    response.cookies.set("nortoo_merchant", String(merchantId), {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // Clear OAuth state cookie
    response.cookies.delete("oauth_state");

    return response;
  } catch (err) {
    console.error("[YouCan OAuth] Unexpected error:", err);
    return errorRedirect("Erreur inattendue. Veuillez réessayer.");
  }
}

// ── Helper: auto-create merchant ──
async function autoCreateMerchant(opts: {
  storeName: string;
  storeEmail: string;
  storeDomain: string;
  storeId: string;
  accessToken: string;
  inviteCode: string;
}) {
  const randomPassword = randomBytes(24).toString("hex");
  const passwordHash = await hash(randomPassword, 12);
  const { key: apiKey, hash: apiKeyHash } = generateApiKey();

  const merchantEmail = opts.storeEmail || "unknown@youcan.shop";

  const [newMerchant] = await db
    .insert(merchants)
    .values({
      name: opts.storeName,
      email: merchantEmail,
      domain: opts.storeDomain,
      passwordHash,
      youcanStoreId: opts.storeId,
      youcanAccessToken: encrypt(opts.accessToken),
      youcanStoreName: opts.storeName,
      apiKey,
      apiKeyHash,
      plan: "trial",
      billingStatus: "trial",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      currentMonthStart: new Date(),
      inviteCode: opts.inviteCode || null,
      emailVerified: new Date(), // YouCan has already verified the email
      consentRecordedAt: new Date(),
    })
    .returning({ id: merchants.id });

  // Also create the admin user row for multi-user support
  await db.insert(users).values({
    merchantId: newMerchant.id,
    email: merchantEmail,
    name: opts.storeName,
    role: "admin",
    status: "active",
  });

  return {
    merchantId: newMerchant.id,
    merchantName: opts.storeName,
    merchantEmail,
    merchantPlan: "trial",
    apiKey,
  };
}
