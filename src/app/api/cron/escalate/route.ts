import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, notifications, auditLogs, merchants } from "@/db/schema";
import { and, eq, lt, gte, asc, isNotNull, or, sql, desc } from "drizzle-orm";
import { recalculateAllProductStats } from "@/lib/product-stats";
import { recalculateAllCityStats } from "@/lib/city-stats";
import { recalculateAllZoneStats } from "@/lib/zone-stats";
import { getEscalationContext } from "@/lib/escalation";
import { verifyCronSecret } from "@/lib/cron-auth";
import { shouldNotify } from "@/lib/notification-helper";
import { withCronMonitoring } from "@/lib/cron-monitor";

/**
 * GET /api/cron/escalate
 * Runs every 15 minutes via Vercel cron.
 * Finds needs_review orders past their reviewDeadline → escalates.
 * Orders are processed by escalationPriority (highest priority first).
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("escalate", async () => {
      const now = new Date();

      // Find orders past their review deadline, ordered by priority (1=highest)
      const overdueOrders = await db
        .select({
          id: orders.id,
          merchantId: orders.merchantId,
          externalRef: orders.externalRef,
          fraudScore: orders.fraudScore,
          decision: orders.decision,
          total: orders.total,
          escalationPriority: orders.escalationPriority,
          reviewDeadline: orders.reviewDeadline,
        })
        .from(orders)
        .where(
          and(
            eq(orders.pipelineStatus, "needs_review"),
            isNotNull(orders.reviewDeadline),
            lt(orders.reviewDeadline, now)
          )
        )
        .orderBy(asc(orders.escalationPriority))
        .limit(50);

      let escalatedCount = 0;

      for (const order of overdueOrders) {
        // Update order to escalated (optimistic lock for idempotency)
        const result = await db
          .update(orders)
          .set({
            pipelineStatus: "escalated",
            escalatedAt: now,
          })
          .where(
            and(
              eq(orders.id, order.id),
              eq(orders.pipelineStatus, "needs_review")
            )
          )
          .returning({ id: orders.id });

        // Skip if another process already escalated this order
        if (result.length === 0) continue;

        const ref = order.externalRef ?? `#${order.id}`;

        // Dynamic severity from escalation context
        const escalationCtx = getEscalationContext(order.decision, order.total);

        // Insert escalation notification with dynamic severity (check preferences)
        if (await shouldNotify(order.merchantId, "escalation")) {
          await db.insert(notifications).values({
            merchantId: order.merchantId,
            orderId: order.id,
            type: "escalation",
            title: `Escalade — Commande ${ref} non traitée`,
            message: `La commande (score ${order.fraudScore}/100) n'a pas été traitée dans le délai imparti. Action immédiate requise.`,
            severity: escalationCtx.severity,
            actionUrl: `/dashboard/orders?selected=${order.id}`,
          });
        }

        // Audit log
        await db.insert(auditLogs).values({
          merchantId: order.merchantId,
          actor: "system",
          action: "escalation",
          targetType: "order",
          targetId: String(order.id),
          details: JSON.stringify({
            previousStatus: "needs_review",
            newStatus: "escalated",
            priority: order.escalationPriority,
            severity: escalationCtx.severity,
            reviewDeadline: order.reviewDeadline?.toISOString(),
            escalatedAt: now.toISOString(),
          }),
        });

        escalatedCount++;
      }

      // ── Stats recalculation (daily consistency check) ──
      let productsUpdated = 0;
      let citiesUpdated = 0;
      let zonesUpdated = 0;

      try {
        // Get all active merchants
        const allMerchants = await db
          .select({ id: merchants.id })
          .from(merchants);

        for (const m of allMerchants) {
          try {
            productsUpdated += await recalculateAllProductStats(m.id);
            citiesUpdated += await recalculateAllCityStats(m.id);
            zonesUpdated += await recalculateAllZoneStats(m.id);
          } catch (err) {
            console.error(`[Cron Escalate] Stats recalc failed for merchant ${m.id}:`, err);
          }
        }
      } catch (err) {
        console.error("[Cron Escalate] Stats recalculation error:", err);
      }

      // ── Webhook silence detection ──
      let webhookAlerts = 0;

      try {
        // Get merchants with a connected store or API key
        const connectedMerchants = await db
          .select({ id: merchants.id, name: merchants.name })
          .from(merchants)
          .where(
            or(
              isNotNull(merchants.youcanStoreId),
              isNotNull(merchants.apiKey)
            )
          );

        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

        for (const m of connectedMerchants) {
          try {
            // Find last real order for this merchant
            const [lastOrder] = await db
              .select({ createdAt: orders.createdAt })
              .from(orders)
              .where(
                and(
                  eq(orders.merchantId, m.id),
                  eq(orders.isTest, false)
                )
              )
              .orderBy(desc(orders.createdAt))
              .limit(1);

            // Skip if merchant has recent webhooks
            if (lastOrder && new Date(lastOrder.createdAt) > twentyFourHoursAgo) continue;

            // Check if we already sent a webhook alert in the last 24h
            const [recentAlert] = await db
              .select({ id: notifications.id })
              .from(notifications)
              .where(
                and(
                  eq(notifications.merchantId, m.id),
                  or(
                    eq(notifications.type, "webhook_silent"),
                    eq(notifications.type, "webhook_dead")
                  ),
                  gte(notifications.createdAt, twentyFourHoursAgo)
                )
              )
              .limit(1);

            if (recentAlert) continue;

            // Determine severity
            const isDead = !lastOrder || new Date(lastOrder.createdAt) < seventyTwoHoursAgo;

            await db.insert(notifications).values({
              merchantId: m.id,
              type: isDead ? "webhook_dead" : "webhook_silent",
              title: isDead
                ? "Webhook inactif depuis +72h"
                : "Aucun webhook reçu depuis 24h",
              message: isDead
                ? "Aucune commande reçue depuis plus de 72 heures. Vérifiez votre connexion webhook dans les paramètres."
                : "Aucune commande reçue depuis 24 heures. Vérifiez que votre webhook est actif.",
              severity: isDead ? "critical" : "warning",
              actionUrl: "/dashboard/settings?tab=store",
            });

            webhookAlerts++;
          } catch (err) {
            console.error(`[Cron Escalate] Webhook check failed for merchant ${m.id}:`, err);
          }
        }
      } catch (err) {
        console.error("[Cron Escalate] Webhook silence detection error:", err);
      }

      return {
        checked: overdueOrders.length,
        escalated: escalatedCount,
        productsUpdated,
        citiesUpdated,
        zonesUpdated,
        webhookAlerts,
        timestamp: now.toISOString(),
      };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[Cron Escalate] Error:", err);
    return NextResponse.json(
      { error: "Escalation cron failed" },
      { status: 500 }
    );
  }
}
