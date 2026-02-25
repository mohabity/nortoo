import { Text, Section, Button, Link } from "@react-email/components";
import * as React from "react";
import { NortooDarkLayout } from "./components/DarkLayout";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";
import { formatDate, formatNumber } from "@/lib/i18n-utils";

interface WeeklyReportProps {
  merchantName: string;
  merchantEmail: string;
  weekStart: string;
  weekEnd: string;
  totalOrders: number;
  blockedOrders: number;
  flaggedOrders: number;
  verifiedOrders: number;
  shippedOrders: number;
  avgScore: number;
  totalRevenue: number;
  blockedRevenue: number;
  savings: number;
  deliveredCount: number;
  returnedCount: number;
  topRiskCities: { city: string; orders: number; blockRate: number }[];
  prevWeekOrders?: number;
  prevWeekBlocked?: number;
  locale?: Locale;
}

function pct(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function trendText(
  current: number,
  previous: number | undefined,
): { arrow: string; pctChange: number; color: string } | null {
  if (previous === undefined || previous === 0) return null;
  const diff = current - previous;
  const arrow = diff >= 0 ? "\u2191" : "\u2193";
  const pctChange = Math.abs(Math.round((diff / previous) * 100));
  const color = diff >= 0 ? "#FBBF24" : "#34D399";
  return { arrow, pctChange, color };
}

function scoreColor(score: number): string {
  if (score <= 30) return "#34D399";
  if (score <= 65) return "#FBBF24";
  return "#F87171";
}

export function WeeklyReport({
  merchantName,
  weekStart,
  weekEnd,
  totalOrders,
  blockedOrders,
  flaggedOrders,
  verifiedOrders,
  shippedOrders,
  avgScore,
  savings,
  deliveredCount,
  returnedCount,
  topRiskCities,
  prevWeekOrders,
  prevWeekBlocked,
  locale = "fr",
}: WeeklyReportProps) {
  const dateOpts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  const weekRange = `${formatDate(weekStart, locale, dateOpts)} \u2014 ${formatDate(weekEnd, locale, dateOpts)}`;
  const blockRate =
    totalOrders > 0 ? Math.round((blockedOrders / totalOrders) * 100) : 0;
  const deliveryTotal = deliveredCount + returnedCount;
  const rtoRate =
    deliveryTotal > 0
      ? Math.round((returnedCount / deliveryTotal) * 100)
      : 0;

  const ordersTrend = trendText(totalOrders, prevWeekOrders);
  const blockedTrend = trendText(blockedOrders, prevWeekBlocked);

  const savingsFormatted = formatNumber(savings, locale);
  const currencyLabel = locale === "en" ? "MAD" : "DH";

  // Build insights
  const insights: string[] = [];
  if (prevWeekOrders !== undefined && totalOrders > prevWeekOrders) {
    insights.push(
      t(locale, "weeklyReport.insight_volume_up", {
        diff: totalOrders - prevWeekOrders,
      }),
    );
  }
  if (prevWeekBlocked !== undefined && blockedOrders < prevWeekBlocked) {
    insights.push(
      t(locale, "weeklyReport.insight_less_blocked", {
        blockedOrders,
        prevWeekBlocked,
      }),
    );
  }
  if (savings > 0) {
    insights.push(
      t(locale, "weeklyReport.insight_savings", {
        savings: `${savingsFormatted} ${currencyLabel}`,
      }),
    );
  }
  if (rtoRate > 20) {
    insights.push(
      t(locale, "weeklyReport.insight_rto_high", { rtoRate }),
    );
  }
  if (topRiskCities.length > 0 && topRiskCities[0].blockRate > 40) {
    insights.push(
      t(locale, "weeklyReport.insight_risky_city", {
        city: topRiskCities[0].city,
        blockRate: Math.round(topRiskCities[0].blockRate),
      }),
    );
  }

  const slicedCities = topRiskCities.slice(0, 5);

  return (
    <NortooDarkLayout
      preview={t(locale, "weeklyReport.preview", {
        weekRange,
        totalOrders,
      })}
      locale={locale}
    >
      {/* Sub-header label */}
      <Section style={{ padding: "0 32px" }}>
        <Text
          style={{
            fontSize: 12,
            color: "#64748B",
            margin: "0 0 0",
            textAlign: "right" as const,
          }}
        >
          {t(locale, "weeklyReport.sub_header")}
        </Text>
      </Section>

      {/* Title + Date Range + Greeting */}
      <Section style={{ padding: "24px 32px 16px" }}>
        <Text
          style={{
            margin: "0 0 4px",
            fontSize: 20,
            fontWeight: 700,
            color: "#FFFFFF",
          }}
        >
          {t(locale, "weeklyReport.title")}
        </Text>
        <Text style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
          {weekRange}
        </Text>
        <Text style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
          {t(locale, "weeklyReport.greeting", { merchantName })} {"\ud83d\udc4b"}
        </Text>
      </Section>

      {/* KPI Grid 2x2 */}
      <Section style={{ padding: "0 32px 24px" }}>
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ borderCollapse: "separate", borderSpacing: 8 }}
        >
          <tbody>
            <tr>
              {/* Scored orders */}
              <td
                style={{
                  background: "#1E293B",
                  borderRadius: 12,
                  padding: 16,
                  width: "50%",
                  verticalAlign: "top",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "#64748B",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.5px",
                  }}
                >
                  {t(locale, "weeklyReport.kpi_scored")}
                </Text>
                <Text
                  style={{
                    margin: "6px 0 0",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "-1px",
                  }}
                >
                  {totalOrders}
                  {ordersTrend && (
                    <span
                      style={{
                        fontSize: 11,
                        color: ordersTrend.color,
                        marginLeft: 4,
                      }}
                    >
                      {ordersTrend.arrow}
                      {ordersTrend.pctChange}%
                    </span>
                  )}
                </Text>
              </td>
              {/* Blocked orders */}
              <td
                style={{
                  background: "#1E293B",
                  borderRadius: 12,
                  padding: 16,
                  width: "50%",
                  verticalAlign: "top",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "#64748B",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.5px",
                  }}
                >
                  {t(locale, "weeklyReport.kpi_blocked")}
                </Text>
                <Text
                  style={{
                    margin: "6px 0 0",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#F87171",
                    letterSpacing: "-1px",
                  }}
                >
                  {blockedOrders}
                  {blockedTrend && (
                    <span
                      style={{
                        fontSize: 11,
                        color: blockedTrend.color,
                        marginLeft: 4,
                      }}
                    >
                      {blockedTrend.arrow}
                      {blockedTrend.pctChange}%
                    </span>
                  )}
                </Text>
                <Text
                  style={{ margin: "4px 0 0", fontSize: 11, color: "#94A3B8" }}
                >
                  {t(locale, "weeklyReport.kpi_block_pct", { blockRate })}
                </Text>
              </td>
            </tr>
            <tr>
              {/* Average score */}
              <td
                style={{
                  background: "#1E293B",
                  borderRadius: 12,
                  padding: 16,
                  width: "50%",
                  verticalAlign: "top",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "#64748B",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.5px",
                  }}
                >
                  {t(locale, "weeklyReport.kpi_avg_score")}
                </Text>
                <Text
                  style={{
                    margin: "6px 0 0",
                    fontSize: 28,
                    fontWeight: 800,
                    color: scoreColor(avgScore),
                    letterSpacing: "-1px",
                  }}
                >
                  {avgScore}
                </Text>
              </td>
              {/* Savings */}
              <td
                style={{
                  background:
                    "linear-gradient(135deg, #064E3B, #1E293B)",
                  borderRadius: 12,
                  padding: 16,
                  width: "50%",
                  verticalAlign: "top",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "#6EE7B7",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.5px",
                  }}
                >
                  {"\ud83d\udcb0"} {t(locale, "weeklyReport.kpi_savings")}
                </Text>
                <Text
                  style={{
                    margin: "6px 0 0",
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#34D399",
                    letterSpacing: "-1px",
                  }}
                >
                  {savingsFormatted} {currencyLabel}
                </Text>
                <Text
                  style={{ margin: "4px 0 0", fontSize: 11, color: "#6EE7B7" }}
                >
                  {t(locale, "weeklyReport.kpi_savings_sub", { blockedOrders })}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Decision Breakdown */}
      <Section style={{ padding: "0 32px 24px" }}>
        <Text
          style={{
            margin: "0 0 12px",
            fontSize: 14,
            fontWeight: 600,
            color: "#94A3B8",
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px",
          }}
        >
          {t(locale, "weeklyReport.decisions_heading")}
        </Text>
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ borderCollapse: "collapse" }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: "8px 0",
                  color: "#34D399",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {"\ud83d\udfe2"} Ship
              </td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "center" as const,
                  color: "#CBD5E1",
                  fontSize: 13,
                }}
              >
                {shippedOrders}
              </td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "right" as const,
                  color: "#64748B",
                  fontSize: 13,
                }}
              >
                {pct(shippedOrders, totalOrders)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "8px 0",
                  color: "#60A5FA",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {"\ud83d\udfd5"} Verify
              </td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "center" as const,
                  color: "#CBD5E1",
                  fontSize: 13,
                }}
              >
                {verifiedOrders}
              </td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "right" as const,
                  color: "#64748B",
                  fontSize: 13,
                }}
              >
                {pct(verifiedOrders, totalOrders)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "8px 0",
                  color: "#FBBF24",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {"\ud83d\udfe1"} Flag
              </td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "center" as const,
                  color: "#CBD5E1",
                  fontSize: 13,
                }}
              >
                {flaggedOrders}
              </td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "right" as const,
                  color: "#64748B",
                  fontSize: 13,
                }}
              >
                {pct(flaggedOrders, totalOrders)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "8px 0",
                  color: "#F87171",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {"\ud83d\udd34"} Block
              </td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "center" as const,
                  color: "#CBD5E1",
                  fontSize: 13,
                }}
              >
                {blockedOrders}
              </td>
              <td
                style={{
                  padding: "8px 0",
                  textAlign: "right" as const,
                  color: "#64748B",
                  fontSize: 13,
                }}
              >
                {pct(blockedOrders, totalOrders)}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Delivery Feedback */}
      {deliveryTotal > 0 && (
        <Section style={{ padding: "0 32px 24px" }}>
          <Text
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              fontWeight: 600,
              color: "#94A3B8",
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
            }}
          >
            {t(locale, "weeklyReport.delivery_heading")}
          </Text>
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ borderCollapse: "collapse" }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "8px 0",
                    color: "#34D399",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {"\u2705"} {t(locale, "weeklyReport.delivered")}
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    textAlign: "center" as const,
                    color: "#CBD5E1",
                    fontSize: 13,
                  }}
                >
                  {deliveredCount}
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    textAlign: "right" as const,
                    color: "#64748B",
                    fontSize: 13,
                  }}
                >
                  {pct(deliveredCount, deliveryTotal)}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "8px 0",
                    color: "#F87171",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {"\u21a9\ufe0f"} {t(locale, "weeklyReport.returned")}
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    textAlign: "center" as const,
                    color: "#CBD5E1",
                    fontSize: 13,
                  }}
                >
                  {returnedCount}
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    textAlign: "right" as const,
                    color: "#64748B",
                    fontSize: 13,
                  }}
                >
                  {pct(returnedCount, deliveryTotal)}
                </td>
              </tr>
            </tbody>
          </table>
          <Text style={{ margin: "8px 0 0", fontSize: 11, color: "#64748B" }}>
            {t(locale, "weeklyReport.rto_rate")}{" "}
            <span
              style={{
                color: rtoRate > 20 ? "#F87171" : "#34D399",
                fontWeight: 600,
              }}
            >
              {rtoRate}%
            </span>
          </Text>
        </Section>
      )}

      {/* Top Risk Cities */}
      {slicedCities.length > 0 && (
        <Section style={{ padding: "0 32px 24px" }}>
          <Text
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              fontWeight: 600,
              color: "#94A3B8",
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
            }}
          >
            {t(locale, "weeklyReport.cities_heading")}
          </Text>
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "6px 12px",
                    textAlign: "left" as const,
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase" as const,
                    borderBottom: "1px solid #334155",
                  }}
                >
                  {t(locale, "weeklyReport.cities_col_city")}
                </th>
                <th
                  style={{
                    padding: "6px 12px",
                    textAlign: "center" as const,
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase" as const,
                    borderBottom: "1px solid #334155",
                  }}
                >
                  {t(locale, "weeklyReport.cities_col_orders")}
                </th>
                <th
                  style={{
                    padding: "6px 12px",
                    textAlign: "center" as const,
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase" as const,
                    borderBottom: "1px solid #334155",
                  }}
                >
                  {t(locale, "weeklyReport.cities_col_block_rate")}
                </th>
              </tr>
            </thead>
            <tbody>
              {slicedCities.map((c) => (
                <tr key={c.city}>
                  <td
                    style={{
                      padding: "6px 12px",
                      borderBottom: "1px solid #1E293B",
                      color: "#CBD5E1",
                      fontSize: 13,
                    }}
                  >
                    {c.city}
                  </td>
                  <td
                    style={{
                      padding: "6px 12px",
                      borderBottom: "1px solid #1E293B",
                      color: "#CBD5E1",
                      fontSize: 13,
                      textAlign: "center" as const,
                    }}
                  >
                    {c.orders}
                  </td>
                  <td
                    style={{
                      padding: "6px 12px",
                      borderBottom: "1px solid #1E293B",
                      color: c.blockRate > 30 ? "#F87171" : "#FBBF24",
                      fontSize: 13,
                      textAlign: "center" as const,
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(c.blockRate)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Insights */}
      <Section style={{ padding: "0 32px 24px" }}>
        <Text
          style={{
            margin: "0 0 12px",
            fontSize: 14,
            fontWeight: 600,
            color: "#94A3B8",
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px",
          }}
        >
          {"\ud83d\udca1"} {t(locale, "weeklyReport.insights_heading")}
        </Text>
        <ul style={{ margin: 0, padding: "0 0 0 20px" }}>
          {insights.length > 0 ? (
            insights.map((insight, i) => (
              <li
                key={i}
                style={{
                  marginBottom: 6,
                  color: "#CBD5E1",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {insight}
              </li>
            ))
          ) : (
            <li style={{ color: "#94A3B8", fontSize: 13 }}>
              {t(locale, "weeklyReport.no_insights")}
            </li>
          )}
        </ul>
      </Section>

      {/* CTA */}
      <Section
        style={{ padding: "0 32px 32px", textAlign: "center" as const }}
      >
        <Button
          href="https://app.nortoo.ma/dashboard"
          style={{
            display: "inline-block",
            backgroundColor: "#00E5A0",
            color: "#0B0F1A",
            fontWeight: 700,
            padding: "14px 40px",
            borderRadius: 12,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          {t(locale, "weeklyReport.cta")}
        </Button>
      </Section>
    </NortooDarkLayout>
  );
}

WeeklyReport.PreviewProps = {
  merchantName: "Ma Boutique",
  merchantEmail: "merchant@example.com",
  weekStart: "2026-02-16",
  weekEnd: "2026-02-22",
  totalOrders: 342,
  blockedOrders: 48,
  flaggedOrders: 29,
  verifiedOrders: 67,
  shippedOrders: 198,
  avgScore: 34,
  totalRevenue: 156000,
  blockedRevenue: 24500,
  savings: 18750,
  deliveredCount: 180,
  returnedCount: 22,
  topRiskCities: [
    { city: "Casablanca", orders: 45, blockRate: 42 },
    { city: "Marrakech", orders: 32, blockRate: 31 },
    { city: "F\u00e8s", orders: 28, blockRate: 25 },
    { city: "Tanger", orders: 19, blockRate: 21 },
  ],
  prevWeekOrders: 310,
  prevWeekBlocked: 55,
} satisfies WeeklyReportProps;

export default WeeklyReport;
