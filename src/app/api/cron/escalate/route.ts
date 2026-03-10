import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, notifications, auditLogs, merchants } from "@/db/schema";
import { and, eq, lt, gte, asc, isNotNull, or, sql, desc, inArray } from "drizzle-orm";
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

      // ── Batch escalation: update all at once with optimistic lock ──
      const overdueIds = overdueOrders.map((o) => o.id);
      const escalatedRows = overdueIds.length > 0
        ? await db
            .update(orders)
            .set({ pipelineStatus: "escalated", escalatedAt: now })
            .where(and(inArray(orders.id, overdueIds), eq(orders.pipelineStatus, "needs_review")))
            .returning({ id: orders.id })
        : [];

      const escalatedIdSet = new Set(escalatedRows.map((r) => r.id));
      const escalatedOrders = overdueOrders.filter((o) => escalatedIdSet.has(o.id));
      const escalatedCount = escalatedOrders.length;

      // TODO: re-enable when whatsapp columns are added to DB
      // Mark WhatsApp verifications as expired for escalated orders
      // if (escalatedIdSet.size > 0) {
      //   await db.update(orders).set({ whatsappVerificationStatus: "expired" })
      //     .where(and(inArray(orders.id, [...escalatedIdSet]), eq(orders.whatsappVerificationStatus, "sent")));
      // }

      // ── Batch notifications + audit logs ──
      if (escalatedOrders.length > 0) {
        // Check notification preferences per merchant (few unique merchants)
        const merchantIds = [...new Set(escalatedOrders.map((o) => o.merchantId))];
        const notifyMap = new Map<number, boolean>();
        await Promise.all(
          merchantIds.map(async (mid) => {
            notifyMap.set(mid, await shouldNotify(mid, "escalation"));
          })
        );

        const notifValues = escalatedOrders
          .filter((o) => notifyMap.get(o.merchantId))
          .map((order) => {
            const ref = order.externalRef ?? `#${order.id}`;
            const ctx = getEscalationContext(order.decision, order.total);
            return {
              merchantId: order.merchantId,
              orderId: order.id,
              type: "escalation" as const,
              title: `Escalade — Commande ${ref} non traitée`,
              message: `La commande (score ${order.fraudScore}/100) n'a pas été traitée dans le délai imparti. Action immédiate requise.`,
              severity: ctx.severity,
              actionUrl: `/dashboard/orders?selected=${order.id}`,
            };
          });

        const auditValues = escalatedOrders.map((order) => {
          const ctx = getEscalationContext(order.decision, order.total);
          return {
            merchantId: order.merchantId,
            actor: "system" as const,
            action: "escalation",
            targetType: "order",
            targetId: String(order.id),
            details: JSON.stringify({
              previousStatus: "needs_review",
              newStatus: "escalated",
              priority: order.escalationPriority,
              severity: ctx.severity,
              reviewDeadline: order.reviewDeadline?.toISOString(),
              escalatedAt: now.toISOString(),
            }),
          };
        });

        await Promise.all([
          notifValues.length > 0 ? db.insert(notifications).values(notifValues) : Promise.resolve(),
          auditValues.length > 0 ? db.insert(auditLogs).values(auditValues) : Promise.resolve(),
        ]);
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

      // ── Webhook silence detection (batched) ──
      let webhookAlerts = 0;

      try {
        const connectedMerchants = await db
          .select({ id: merchants.id, name: merchants.name })
          .from(merchants)
          .where(or(isNotNull(merchants.youcanStoreId), isNotNull(merchants.apiKey)));

        if (connectedMerchants.length > 0) {
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
          const merchantIds = connectedMerchants.map((m) => m.id);

          // Pre-fetch: latest order per merchant + recent alerts — 2 queries instead of N*2
          const [lastOrders, recentAlerts] = await Promise.all([
            db
              .select({
                merchantId: orders.merchantId,
                lastCreated: sql<Date>`max(${orders.createdAt})`.as("last_created"),
              })
              .from(orders)
              .where(and(inArray(orders.merchantId, merchantIds), eq(orders.isTest, false)))
              .groupBy(orders.merchantId),
            db
              .select({ merchantId: notifications.merchantId })
              .from(notifications)
              .where(
                and(
                  inArray(notifications.merchantId, merchantIds),
                  or(eq(notifications.type, "webhook_silent"), eq(notifications.type, "webhook_dead")),
                  gte(notifications.createdAt, twentyFourHoursAgo)
                )
              ),
          ]);

          const lastOrderMap = new Map(lastOrders.map((r) => [r.merchantId, new Date(r.lastCreated)]));
          const alertedSet = new Set(recentAlerts.map((r) => r.merchantId));

          const newAlerts = connectedMerchants
            .filter((m) => {
              if (alertedSet.has(m.id)) return false;
              const last = lastOrderMap.get(m.id);
              return !last || last <= twentyFourHoursAgo;
            })
            .map((m) => {
              const last = lastOrderMap.get(m.id);
              const isDead = !last || last < seventyTwoHoursAgo;
              return {
                merchantId: m.id,
                type: isDead ? ("webhook_dead" as const) : ("webhook_silent" as const),
                title: isDead ? "Webhook inactif depuis +72h" : "Aucun webhook reçu depuis 24h",
                message: isDead
                  ? "Aucune commande reçue depuis plus de 72 heures. Vérifiez votre connexion webhook dans les paramètres."
                  : "Aucune commande reçue depuis 24 heures. Vérifiez que votre webhook est actif.",
                severity: isDead ? ("critical" as const) : ("warning" as const),
                actionUrl: "/dashboard/settings?tab=store",
              };
            });

          if (newAlerts.length > 0) {
            await db.insert(notifications).values(newAlerts);
            webhookAlerts = newAlerts.length;
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
