import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, auditLogs } from "@/db/schema";
import { and, eq, gte, lte, like, or, desc } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { decisionLabel } from "@/lib/utils";

// ── Rate limiting (in-memory) ──
const exportCounts = new Map<number, { count: number; resetAt: number }>();
const MAX_EXPORTS_PER_HOUR = 10;
const MAX_ROWS = 10_000;

function checkRateLimit(merchantId: number): boolean {
  const now = Date.now();
  const entry = exportCounts.get(merchantId);
  if (!entry || now > entry.resetAt) {
    exportCounts.set(merchantId, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= MAX_EXPORTS_PER_HOUR) return false;
  entry.count++;
  return true;
}

/** Pipeline status → French label */
function pipelineLabel(status: string): string {
  switch (status) {
    case "pending": return "En attente";
    case "auto_shipped": return "Auto-exp\u00E9di\u00E9";
    case "needs_review": return "\u00C0 v\u00E9rifier";
    case "escalated": return "Escalad\u00E9";
    case "auto_blocked": return "Auto-bloqu\u00E9";
    case "merchant_override": return "Override";
    default: return status;
  }
}

/** RFC 4180 CSV field escaping */
function csvField(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/** Format date as YYYY-MM-DD HH:mm */
function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * GET /api/orders/export
 * Exports orders as CSV with UTF-8 BOM.
 * Same filters as GET /api/orders.
 */
export async function GET(request: NextRequest) {
  const merchantId = await getMerchantId();
  const params = request.nextUrl.searchParams;

  // Rate limit
  if (!checkRateLimit(merchantId)) {
    return NextResponse.json(
      { error: "Limite d'export atteinte (10/heure). R\u00E9essayez plus tard." },
      { status: 429 }
    );
  }

  // Parse filters (same as /api/orders)
  const decision = params.get("decision");
  const pipeline = params.get("pipeline");
  const city = params.get("city");
  const scoreMin = params.get("score_min");
  const scoreMax = params.get("score_max");
  const from = params.get("from");
  const to = params.get("to");
  const search = params.get("search");

  const conditions: ReturnType<typeof eq>[] = [eq(orders.merchantId, merchantId)];

  if (decision && decision !== "all") {
    conditions.push(eq(orders.decision, decision));
  }
  if (pipeline && pipeline !== "all") {
    conditions.push(eq(orders.pipelineStatus, pipeline));
  }
  if (city && city !== "all") {
    conditions.push(eq(orders.shippingCity, city));
  }
  if (scoreMin) {
    conditions.push(gte(orders.fraudScore, parseInt(scoreMin, 10)));
  }
  if (scoreMax) {
    conditions.push(lte(orders.fraudScore, parseInt(scoreMax, 10)));
  }
  if (from) {
    conditions.push(gte(orders.createdAt, new Date(from)));
  }
  if (to) {
    conditions.push(lte(orders.createdAt, new Date(to)));
  }
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(orders.externalRef, pattern),
        like(orders.customerName, pattern),
        like(orders.shippingCity, pattern)
      )!
    );
  }

  const where = and(...conditions);

  // Query with limit + 1 to detect truncation
  const data = await db
    .select({
      externalRef: orders.externalRef,
      createdAt: orders.createdAt,
      customerName: orders.customerName,
      customerPhoneLast4: orders.customerPhoneLast4,
      shippingCity: orders.shippingCity,
      parsedZone: orders.parsedZone,
      shippingAddress: orders.shippingAddress,
      productName: orders.productName,
      quantity: orders.quantity,
      total: orders.total,
      fraudScore: orders.fraudScore,
      decision: orders.decision,
      overrideDecision: orders.overrideDecision,
      pipelineStatus: orders.pipelineStatus,
      scoreExplanation: orders.scoreExplanation,
      addressConfidence: orders.addressConfidence,
    })
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(MAX_ROWS + 1);

  const truncated = data.length > MAX_ROWS;
  const rows = truncated ? data.slice(0, MAX_ROWS) : data;

  // Build CSV
  const BOM = "\uFEFF";
  const CRLF = "\r\n";
  const header = [
    "R\u00E9f\u00E9rence", "Date", "Client", "T\u00E9l\u00E9phone",
    "Ville", "Quartier", "Adresse", "Produit", "Quantit\u00E9",
    "Montant (DH)", "Score", "D\u00E9cision", "Pipeline",
    "Analyse", "Confiance adresse",
  ].map(csvField).join(",");

  const csvRows = rows.map((row) => {
    let explanationSummary = "";
    if (row.scoreExplanation) {
      try { explanationSummary = JSON.parse(row.scoreExplanation).summary ?? ""; } catch { /* */ }
    }

    const effectiveDecision = row.overrideDecision ?? row.decision;
    const confidenceStr = row.addressConfidence != null
      ? `${Math.round(row.addressConfidence * 100)}%`
      : "";

    return [
      csvField(row.externalRef),
      csvField(formatDate(row.createdAt)),
      csvField(row.customerName),
      csvField(row.customerPhoneLast4 ? `***${row.customerPhoneLast4}` : ""),
      csvField(row.shippingCity),
      csvField(row.parsedZone),
      csvField(row.shippingAddress),
      csvField(row.productName),
      csvField(row.quantity),
      csvField(row.total),
      csvField(row.fraudScore),
      csvField(decisionLabel(effectiveDecision)),
      csvField(pipelineLabel(row.pipelineStatus)),
      csvField(explanationSummary),
      csvField(confidenceStr),
    ].join(",");
  });

  const csv = BOM + header + CRLF + csvRows.join(CRLF) + CRLF;

  // Audit log
  const filtersUsed = Object.fromEntries(
    [
      ["decision", decision], ["pipeline", pipeline], ["city", city],
      ["score_min", scoreMin], ["score_max", scoreMax],
      ["from", from], ["to", to], ["search", search],
    ].filter(([, v]) => v)
  );

  await db.insert(auditLogs).values({
    merchantId,
    actor: "merchant",
    action: "orders_exported",
    targetType: "order",
    details: JSON.stringify({
      rows: rows.length,
      truncated,
      filters: filtersUsed,
    }),
  });

  // Date for filename
  const today = new Date().toISOString().slice(0, 10);

  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename="commandes-${today}.csv"`);
  if (truncated) {
    headers.set("X-Truncated", "true");
  }

  return new Response(csv, { status: 200, headers });
}
