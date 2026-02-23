import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { isNotNull } from "drizzle-orm";
import { decryptSafe } from "@/lib/encryption";

/**
 * GET /api/admin/youcan/list-webhooks
 *
 * Diagnostic: lists all active YouCan webhook subscriptions for each merchant.
 * Shows event name, target_url, and id — to verify correct setup.
 */
export async function GET() {
  const youcanMerchants = await db
    .select({
      id: merchants.id,
      youcanStoreName: merchants.youcanStoreName,
      youcanStoreId: merchants.youcanStoreId,
      youcanAccessToken: merchants.youcanAccessToken,
      apiKey: merchants.apiKey,
    })
    .from(merchants)
    .where(isNotNull(merchants.youcanStoreId));

  const results: Array<{
    merchantId: number;
    storeName: string | null;
    webhooks: Array<{ id: string; event: string; target_url: string }>;
    error?: string;
  }> = [];

  for (const m of youcanMerchants) {
    const result: (typeof results)[0] = {
      merchantId: m.id,
      storeName: m.youcanStoreName,
      webhooks: [],
    };

    try {
      const accessToken = decryptSafe(m.youcanAccessToken);
      if (!accessToken) {
        result.error = "No access token";
        results.push(result);
        continue;
      }

      const res = await fetch("https://api.youcan.shop/resthooks/list", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        result.error = `API error: ${res.status} ${(await res.text()).substring(0, 200)}`;
        results.push(result);
        continue;
      }

      result.webhooks = await res.json();
    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err);
    }

    results.push(result);
  }

  return NextResponse.json({ results });
}
