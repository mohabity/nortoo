import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { processIncomingOrder } from "@/lib/ingest";
import { MS_HOUR } from "@/lib/constants";

// ── Rate limiting (in-memory) ──
const testCounts = new Map<number, { count: number; resetAt: number }>();
const MAX_TESTS_PER_HOUR = 5;

function checkRateLimit(merchantId: number): boolean {
  const now = Date.now();
  const entry = testCounts.get(merchantId);
  if (!entry || now > entry.resetAt) {
    testCounts.set(merchantId, { count: 1, resetAt: now + MS_HOUR });
    return true;
  }
  if (entry.count >= MAX_TESTS_PER_HOUR) return false;
  entry.count++;
  return true;
}

// ── Moroccan test data ──
const TEST_NAMES = ["Fatima Zahra Test", "Ahmed Test", "Youssef Test", "Salma Test"];
const TEST_CITIES = ["Casablanca", "Rabat", "Marrakech"];
const TEST_ADDRESSES = [
  "123 Rue Test, Quartier Maârif",
  "45 Boulevard Demo, Agdal",
  "78 Avenue Essai, Guéliz",
];
const TEST_PRODUCTS = ["T-shirt Nike (TEST)", "Baskets Puma (TEST)"];
const TEST_PHONE = "0600000000";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * POST /api/webhook/test
 * Sends a fake test order through the full scoring pipeline.
 * Rate limited: 5 tests per hour per merchant.
 * Test orders are flagged isTest=true and excluded from all stats.
 */
export async function POST() {
  let merchantId: number;
  try {
    merchantId = await getMerchantId();
  } catch {
    return NextResponse.json(
      { error: "Non authentifié. Connectez-vous sur /login." },
      { status: 401 }
    );
  }

  if (!checkRateLimit(merchantId)) {
    return NextResponse.json(
      { error: "Limite atteinte : 5 tests par heure" },
      { status: 429 }
    );
  }

  const [merchant] = await db
    .select({
      verifyThreshold: merchants.verifyThreshold,
      flagThreshold: merchants.flagThreshold,
      blockThreshold: merchants.blockThreshold,
      autoBlockEnabled: merchants.autoBlockEnabled,
      escalationConfig: merchants.escalationConfig,
      dataRetentionMonths: merchants.dataRetentionMonths,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!merchant) {
    return NextResponse.json(
      { error: "Marchand introuvable" },
      { status: 404 }
    );
  }

  const testName = pick(TEST_NAMES);
  const testCity = pick(TEST_CITIES);
  const testAddress = pick(TEST_ADDRESSES);
  const testProduct = pick(TEST_PRODUCTS);
  const testTotal = Math.round(100 + Math.random() * 400); // 100-500 DH
  const testRef = `#TEST-${Date.now().toString(36).toUpperCase()}`;

  const startTime = Date.now();

  try {
    const result = await processIncomingOrder({
      merchantId,
      merchant: {
        verifyThreshold: merchant.verifyThreshold,
        flagThreshold: merchant.flagThreshold,
        blockThreshold: merchant.blockThreshold,
        autoBlockEnabled: merchant.autoBlockEnabled,
        escalationConfig: merchant.escalationConfig,
        dataRetentionMonths: merchant.dataRetentionMonths,
      },
      phone: TEST_PHONE,
      customerName: testName,
      customerCity: testCity,
      ref: testRef,
      total: testTotal,
      currency: "MAD",
      productName: testProduct,
      shippingCity: testCity,
      shippingAddress: testAddress,
      orderHour: new Date().getHours(),
      isTest: true,
    });

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      data: {
        ...result,
        testOrder: {
          ref: testRef,
          customer: testName,
          city: testCity,
          product: testProduct,
          total: testTotal,
        },
        durationMs,
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json(
      {
        error: message,
        durationMs,
      },
      { status: 500 }
    );
  }
}
