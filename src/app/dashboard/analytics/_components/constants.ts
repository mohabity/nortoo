// ═══════════════════════════════════════════════════════════
// MOCK DATA — Realistic Moroccan e-commerce over 30 days
// RTO trend: 35% → 28% → 20% → 13% to show nortoo impact
// ═══════════════════════════════════════════════════════════

export function generateDailyData(days: number) {
  const data = [];
  const now = new Date(2026, 1, 19); // Feb 19, 2026

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    // Week progression for RTO reduction
    const weekIndex = Math.floor((days - 1 - i) / 7);
    const baseTotals = [32, 36, 40, 45]; // Orders grow as confidence grows
    const baseRTO = [0.35, 0.28, 0.20, 0.13]; // RTO drops week by week
    const week = Math.min(weekIndex, 3);

    // Daily variation
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dailyMultiplier = isWeekend ? 0.7 : 1 + (Math.random() - 0.5) * 0.4;
    const orders = Math.round(baseTotals[week] * dailyMultiplier);
    const rtoRate = baseRTO[week] + (Math.random() - 0.5) * 0.06;
    const returns = Math.max(0, Math.round(orders * Math.max(0.05, rtoRate)));
    const delivered = orders - returns;

    data.push({
      rawDate: d.toISOString(),
      date: "", // formatted in component
      fullDate: "", // formatted in component
      orders,
      delivered,
      returns,
      rtoRate: Math.round((returns / orders) * 100),
    });
  }
  return data;
}

export const DAILY_DATA_90 = generateDailyData(90);

// ── Score distribution data (labels resolved in component via t()) ──
export const scoreDistributionBase = [
  { range: "0-30", labelKey: "analytics.scoreDistribution.low", count: 312, color: "#00E5A0" },
  { range: "31-65", labelKey: "analytics.scoreDistribution.medium", count: 145, color: "#F59E0B" },
  { range: "66-85", labelKey: "analytics.scoreDistribution.high", count: 62, color: "#F43F5E" },
  { range: "86-100", labelKey: "analytics.scoreDistribution.critical", count: 23, color: "#8B5CF6" },
];

// ── Hourly patterns data ──
export const hourlyData = Array.from({ length: 24 }, (_, h) => {
  // Orders distribution: peak at 10-12h and 20-22h, low 1-5h
  const isNight = h >= 1 && h <= 5;
  const isPeak = (h >= 10 && h <= 12) || (h >= 20 && h <= 22);
  const isMorning = h >= 8 && h <= 9;
  const isAfternoon = h >= 14 && h <= 18;

  let orders: number;
  if (isNight) orders = Math.round(3 + Math.random() * 4);
  else if (isPeak) orders = Math.round(28 + Math.random() * 15);
  else if (isMorning || isAfternoon) orders = Math.round(18 + Math.random() * 10);
  else orders = Math.round(8 + Math.random() * 8);

  // Risk is 2× higher at night
  const riskRate = isNight
    ? Math.round(35 + Math.random() * 20)
    : isPeak
      ? Math.round(12 + Math.random() * 8)
      : Math.round(16 + Math.random() * 12);

  return {
    hour: `${h}h`,
    hourNum: h,
    orders,
    riskRate,
    isNight,
    isPeak,
  };
});

// ── Decision breakdown data (labels resolved in component via t()) ──
export const decisionDataBase = [
  { nameKey: "decisions.ship", value: 312, pct: 57.6, color: "#00E5A0" },
  { nameKey: "decisions.verify", value: 145, pct: 26.8, color: "#F59E0B" },
  { nameKey: "decisions.flag", value: 62, pct: 11.4, color: "#F43F5E" },
  { nameKey: "decisions.block", value: 23, pct: 4.2, color: "#8B5CF6" },
];
