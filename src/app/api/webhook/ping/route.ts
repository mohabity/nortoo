import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * POST /api/webhook/ping
 * Pings the YouCan API to verify the merchant's access token is still valid.
 * Returns status + latency.
 */
export async function POST() {
  const merchantId = await getMerchantId();

  const [merchant] = await db
    .select({
      youcanAccessToken: merchants.youcanAccessToken,
      youcanStoreId: merchants.youcanStoreId,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!merchant?.youcanAccessToken) {
    return NextResponse.json({
      data: { status: "no_token", latencyMs: 0 },
    });
  }

  const start = Date.now();

  try {
    const res = await fetch("https://api.youcan.shop/me", {
      headers: { Authorization: `Bearer ${merchant.youcanAccessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    const latencyMs = Date.now() - start;

    if (res.ok) {
      return NextResponse.json({ data: { status: "ok", latencyMs } });
    } else if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ data: { status: "expired", latencyMs } });
    } else {
      return NextResponse.json({
        data: { status: "error", latencyMs, httpStatus: res.status },
      });
    }
  } catch {
    const latencyMs = Date.now() - start;
    return NextResponse.json({
      data: { status: "unreachable", latencyMs },
    });
  }
}
