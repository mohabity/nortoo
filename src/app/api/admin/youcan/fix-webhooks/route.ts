import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { isNotNull } from "drizzle-orm";
import { decryptSafe } from "@/lib/encryption";

/**
 * POST /api/admin/youcan/fix-webhooks
 *
 * Emergency admin endpoint to repair YouCan webhook subscriptions.
 * For each merchant with a YouCan store connected:
 * 1. List all existing webhooks
 * 2. Unsubscribe ALL (cleanup invalid events like order.created, order.paid)
 * 3. Re-subscribe to order.create with the correct URL
 *
 * Auth: CRON_SECRET header (same as cron jobs — no user session needed)
 */
export async function POST(request: Request) {
  // Simple auth — use CRON_SECRET or a shared admin secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.nortoo.ma";
  const results: Array<{
    merchantId: number;
    storeName: string | null;
    existing: number;
    removed: number;
    subscribed: boolean;
    error?: string;
  }> = [];

  // Find all merchants with a YouCan store connected
  const youcanMerchants = await db
    .select({
      id: merchants.id,
      youcanStoreId: merchants.youcanStoreId,
      youcanStoreName: merchants.youcanStoreName,
      youcanAccessToken: merchants.youcanAccessToken,
      apiKey: merchants.apiKey,
    })
    .from(merchants)
    .where(isNotNull(merchants.youcanStoreId));

  for (const m of youcanMerchants) {
    const result: (typeof results)[0] = {
      merchantId: m.id,
      storeName: m.youcanStoreName,
      existing: 0,
      removed: 0,
      subscribed: false,
    };

    try {
      // Decrypt access token
      const accessToken = decryptSafe(m.youcanAccessToken);
      if (!accessToken) {
        result.error = "No access token";
        results.push(result);
        continue;
      }

      // ── Step 1: List existing webhooks ──
      const listRes = await fetch("https://api.youcan.shop/resthooks/list", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!listRes.ok) {
        result.error = `List failed: ${listRes.status} ${await listRes.text()}`;
        results.push(result);
        continue;
      }

      const hooks: Array<{ id: string; event: string; target_url: string }> = await listRes.json();
      result.existing = hooks.length;

      // ── Step 2: Unsubscribe ALL existing webhooks ──
      for (const hook of hooks) {
        try {
          const unsubRes = await fetch(
            `https://api.youcan.shop/resthooks/unsubscribe/${hook.id}`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (unsubRes.ok) {
            result.removed++;
          } else {
            console.error(
              `[fix-webhooks] Unsubscribe ${hook.id} failed:`,
              await unsubRes.text()
            );
          }
        } catch (err) {
          console.error(`[fix-webhooks] Unsubscribe ${hook.id} error:`, err);
        }
      }

      // ── Step 3: Subscribe to order events ──
      // YouCan may not fire order.create for COD orders (unpaid on creation).
      // Subscribe to both order.create and order.update to catch all cases.
      const webhookUrl = `${appUrl}/api/webhook/youcan?key=${m.apiKey}`;
      const events = ["order.create", "order.update"];
      const subscribeErrors: string[] = [];

      for (const event of events) {
        const subRes = await fetch("https://api.youcan.shop/resthooks/subscribe", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target_url: webhookUrl,
            event,
          }),
        });

        if (!subRes.ok) {
          const errText = await subRes.text();
          subscribeErrors.push(`${event}: ${subRes.status} ${errText.substring(0, 100)}`);
        }
      }

      if (subscribeErrors.length === 0) {
        result.subscribed = true;
      } else {
        // Partial success is still considered subscribed if at least one worked
        result.subscribed = subscribeErrors.length < events.length;
        result.error = subscribeErrors.join("; ");
      }

      // ── Audit log ──
      await db.insert(auditLogs).values({
        merchantId: m.id,
        actor: "system",
        action: "webhook_repair",
        targetType: "merchant",
        targetId: String(m.id),
        details: JSON.stringify({
          existingHooks: hooks.length,
          removedHooks: result.removed,
          subscribed: result.subscribed,
          webhookUrl,
        }),
      });
    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err);
    }

    results.push(result);
  }

  return NextResponse.json({
    message: `Fixed webhooks for ${results.length} merchant(s)`,
    results,
  });
}
