import jsPDF from "jspdf";

// ── Data types ──

export interface ReportData {
  merchant: { name: string; plan: string };
  period: { from: Date; to: Date; label: string };
  generatedAt: Date;
  kpis: {
    totalOrders: number;
    deliveryRate: number; // 0-1
    savings: number; // DH
    roi: number; // multiplier
  };
  comparison: {
    deliveryRateChange: number; // delta vs previous month
    savingsChange: number; // delta DH
  };
  decisions: { ship: number; verify: number; flag: number; block: number };
  avgScore: number;
  cities: Array<{
    name: string;
    orders: number;
    rtoRate: number; // 0-1
    scoreDelta: number;
    trend: string;
  }>;
  products: Array<{
    name: string;
    orders: number;
    rtoRate: number; // 0-1
    lostRevenue: number; // DH
  }>;
  weeklyData: Array<{
    label: string;
    ship: number;
    verify: number;
    flag: number;
    block: number;
  }>;
  savings: { totalSaved: number; ordersSaved: number };
}

// ── Colors (nortoo palette) ──

const COLORS = {
  mint: [0, 229, 160] as [number, number, number],
  mintDeep: [5, 150, 105] as [number, number, number],
  ocean: [14, 165, 233] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  rose: [244, 63, 94] as [number, number, number],
  midnight: [11, 15, 26] as [number, number, number],
  fog: [100, 116, 139] as [number, number, number],
  snow: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  silk: [226, 232, 240] as [number, number, number],
};

// ── Helpers ──

function formatDH(n: number): string {
  return n.toLocaleString("fr-FR") + " DH";
}

function formatPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function setColor(doc: jsPDF, color: [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function setFillColor(doc: jsPDF, color: [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
}

function drawRoundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: [number, number, number]
) {
  setFillColor(doc, fill);
  doc.roundedRect(x, y, w, h, r, r, "F");
}

// ── Insight generation ──

export function generateInsights(data: ReportData): string[] {
  const insights: string[] = [];

  // 1. Worst city by RTO rate
  const worstCity = [...data.cities]
    .filter((c) => c.orders >= 10)
    .sort((a, b) => b.rtoRate - a.rtoRate)[0];
  if (worstCity && worstCity.rtoRate > 0.25) {
    insights.push(
      `La ville de ${worstCity.name} a un taux de retour de ${(worstCity.rtoRate * 100).toFixed(0)}% — envisagez de renforcer la verification pour cette zone.`
    );
  }

  // 2. Worst product by lost revenue
  const worstProduct = [...data.products].sort(
    (a, b) => b.lostRevenue - a.lostRevenue
  )[0];
  if (worstProduct && worstProduct.rtoRate > 0.3) {
    insights.push(
      `Le produit "${worstProduct.name}" concentre ${worstProduct.lostRevenue.toLocaleString("fr-FR")} DH de pertes — verifiez la qualite des leads pour ce produit.`
    );
  }

  // 3. Delivery rate trend
  if (data.comparison.deliveryRateChange > 0) {
    insights.push(
      `Votre taux de livraison a augmente de ${(data.comparison.deliveryRateChange * 100).toFixed(1)}% par rapport au mois dernier — continuez sur cette lancee !`
    );
  }

  // 4. Savings highlight
  if (data.savings.totalSaved > 1000) {
    insights.push(
      `nortoo vous a fait economiser ${data.savings.totalSaved.toLocaleString("fr-FR")} DH ce mois en bloquant ${data.savings.ordersSaved} commandes a risque.`
    );
  }

  return insights.slice(0, 3);
}

// ── Footer (all pages) ──

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(7);
  setColor(doc, COLORS.fog);
  doc.setFont("helvetica", "normal");
  doc.text(
    "nortoo  -  Scoring anti-fraude COD  -  nortoo.io",
    pageW / 2,
    pageH - 10,
    { align: "center" }
  );
  doc.text(`${pageNum} / ${totalPages}`, pageW - 20, pageH - 10, {
    align: "right",
  });
}

// ══════════════════════════════════════
// PAGE 1: Header + KPIs + Decision bar
// ══════════════════════════════════════

function drawPage1(doc: jsPDF, data: ReportData) {
  const margin = 20;
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  // ── Header ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setColor(doc, COLORS.mintDeep);
  doc.text("nortoo", margin, y + 6);

  doc.setFontSize(13);
  setColor(doc, COLORS.fog);
  doc.setFont("helvetica", "normal");
  doc.text("Rapport mensuel", pageW - margin, y + 6, { align: "right" });

  y += 16;

  // Merchant name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(doc, COLORS.midnight);
  doc.text(data.merchant.name, margin, y);
  y += 7;

  // Period
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(doc, COLORS.fog);
  doc.text(data.period.label, margin, y);
  y += 5;
  doc.text(`Genere le ${formatDate(data.generatedAt)}`, margin, y);
  y += 12;

  // ── Separator ──
  setFillColor(doc, COLORS.silk);
  doc.rect(margin, y, pageW - 2 * margin, 0.4, "F");
  y += 10;

  // ── 4 KPI cards (2×2 grid) ──
  const cardW = (pageW - 2 * margin - 8) / 2;
  const cardH = 34;
  const gap = 8;

  const kpis = [
    {
      label: "Commandes traitees",
      value: data.kpis.totalOrders.toLocaleString("fr-FR"),
      unit: "",
    },
    {
      label: "Taux de livraison",
      value: formatPct(data.kpis.deliveryRate),
      unit: "",
      delta:
        data.comparison.deliveryRateChange !== 0
          ? `${data.comparison.deliveryRateChange > 0 ? "+" : ""}${(data.comparison.deliveryRateChange * 100).toFixed(1)}%`
          : null,
      deltaPositive: data.comparison.deliveryRateChange >= 0,
    },
    {
      label: "Economies estimees",
      value: formatDH(data.kpis.savings),
      unit: "",
      delta:
        data.comparison.savingsChange !== 0
          ? `${data.comparison.savingsChange > 0 ? "+" : ""}${data.comparison.savingsChange.toLocaleString("fr-FR")} DH`
          : null,
      deltaPositive: data.comparison.savingsChange >= 0,
    },
    {
      label: "ROI abonnement",
      value: data.kpis.roi.toFixed(1) + "x",
      unit: "",
    },
  ];

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = margin + col * (cardW + gap);
    const cy = y + row * (cardH + gap);

    // Card background
    drawRoundedRect(doc, cx, cy, cardW, cardH, 3, COLORS.snow);

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, COLORS.fog);
    doc.text(kpis[i].label, cx + 8, cy + 10);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    setColor(doc, COLORS.midnight);
    doc.text(kpis[i].value, cx + 8, cy + 24);

    // Delta (if available)
    const kpi = kpis[i] as {
      delta?: string | null;
      deltaPositive?: boolean;
    };
    if (kpi.delta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setColor(doc, kpi.deltaPositive ? COLORS.mintDeep : COLORS.rose);
      doc.text(kpi.delta + " vs mois precedent", cx + 8, cy + 30);
    }
  }

  y += 2 * (cardH + gap) + 6;

  // ── Decision distribution bar ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(doc, COLORS.midnight);
  doc.text("Distribution des decisions", margin, y);
  y += 8;

  const total =
    data.decisions.ship +
    data.decisions.verify +
    data.decisions.flag +
    data.decisions.block;
  const barW = pageW - 2 * margin;
  const barH = 14;

  if (total > 0) {
    const segments = [
      { count: data.decisions.ship, color: COLORS.mint, label: "Expedier" },
      { count: data.decisions.verify, color: COLORS.ocean, label: "Verifier" },
      { count: data.decisions.flag, color: COLORS.amber, label: "Signaler" },
      { count: data.decisions.block, color: COLORS.rose, label: "Bloquer" },
    ];

    let bx = margin;
    for (const seg of segments) {
      const w = (seg.count / total) * barW;
      if (w > 0) {
        setFillColor(doc, seg.color);
        doc.rect(bx, y, w, barH, "F");

        // Label inside bar (only if wide enough)
        if (w > 25) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          setColor(doc, COLORS.white);
          const pct = ((seg.count / total) * 100).toFixed(0) + "%";
          doc.text(pct, bx + w / 2, y + barH / 2 + 1, { align: "center" });
        }
        bx += w;
      }
    }

    // Legend below bar
    y += barH + 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    let lx = margin;
    for (const seg of segments) {
      setFillColor(doc, seg.color);
      doc.rect(lx, y - 2.5, 3, 3, "F");
      setColor(doc, COLORS.fog);
      const text = `${seg.label} ${((seg.count / total) * 100).toFixed(0)}%`;
      doc.text(text, lx + 5, y);
      lx += doc.getTextWidth(text) + 12;
    }

    y += 8;
  }

  // Summary text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, COLORS.fog);
  doc.text(
    `${data.decisions.ship} commandes expediees automatiquement`,
    margin,
    y
  );
  y += 4.5;
  doc.text(
    `${data.decisions.block} commandes bloquees (auto + manuelles)`,
    margin,
    y
  );
  y += 4.5;
  doc.text(`Score moyen : ${data.avgScore.toFixed(1)}`, margin, y);

  drawFooter(doc, 1, 3);
}

// ══════════════════════════════════════
// PAGE 2: Cities table + Products table
// ══════════════════════════════════════

function drawPage2(doc: jsPDF, data: ReportData) {
  const margin = 20;
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  // ── Cities table ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(doc, COLORS.midnight);
  doc.text("Top villes a risque", margin, y + 4);
  y += 12;

  const cityCols = [
    { label: "Ville", w: 45, align: "left" as const },
    { label: "Commandes", w: 28, align: "right" as const },
    { label: "Taux RTO", w: 25, align: "right" as const },
    { label: "Score auto", w: 28, align: "right" as const },
    { label: "Tendance", w: 38, align: "left" as const },
  ];

  // Header row
  setFillColor(doc, COLORS.midnight);
  doc.rect(margin, y, pageW - 2 * margin, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(doc, COLORS.white);

  let cx = margin + 3;
  for (const col of cityCols) {
    doc.text(col.label, cx, y + 5.5);
    cx += col.w;
  }
  y += 8;

  // Data rows
  const cities = data.cities.slice(0, 10);
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const rowH = 7;

    // Alternating row bg
    if (i % 2 === 0) {
      setFillColor(doc, COLORS.snow);
      doc.rect(margin, y, pageW - 2 * margin, rowH, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setColor(doc, COLORS.midnight);

    cx = margin + 3;
    const row = [
      city.name,
      String(city.orders),
      formatPct(city.rtoRate),
      city.scoreDelta >= 0 ? `+${city.scoreDelta}` : String(city.scoreDelta),
      city.trend,
    ];
    for (let j = 0; j < cityCols.length; j++) {
      doc.text(row[j], cx, y + 5);
      cx += cityCols[j].w;
    }
    y += rowH;
  }

  if (cities.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    setColor(doc, COLORS.fog);
    doc.text("Aucune donnee de ville disponible.", margin, y + 5);
    y += 10;
  }

  y += 14;

  // ── Products table ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(doc, COLORS.midnight);
  doc.text("Top produits a risque", margin, y + 4);
  y += 12;

  const prodCols = [
    { label: "Produit", w: 60, align: "left" as const },
    { label: "Commandes", w: 28, align: "right" as const },
    { label: "Taux RTO", w: 28, align: "right" as const },
    { label: "Revenue perdue", w: 38, align: "right" as const },
  ];

  // Header row
  setFillColor(doc, COLORS.midnight);
  doc.rect(margin, y, pageW - 2 * margin, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(doc, COLORS.white);

  cx = margin + 3;
  for (const col of prodCols) {
    doc.text(col.label, cx, y + 5.5);
    cx += col.w;
  }
  y += 8;

  // Data rows
  const products = data.products.slice(0, 5);
  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const rowH = 7;

    if (i % 2 === 0) {
      setFillColor(doc, COLORS.snow);
      doc.rect(margin, y, pageW - 2 * margin, rowH, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setColor(doc, COLORS.midnight);

    cx = margin + 3;
    // Truncate long product names
    const pName =
      prod.name.length > 30 ? prod.name.slice(0, 28) + "..." : prod.name;
    const row = [
      pName,
      String(prod.orders),
      formatPct(prod.rtoRate),
      formatDH(prod.lostRevenue),
    ];
    for (let j = 0; j < prodCols.length; j++) {
      doc.text(row[j], cx, y + 5);
      cx += prodCols[j].w;
    }
    y += rowH;
  }

  if (products.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    setColor(doc, COLORS.fog);
    doc.text("Aucune donnee de produit disponible.", margin, y + 5);
    y += 10;
  }

  drawFooter(doc, 2, 3);
}

// ══════════════════════════════════════
// PAGE 3: Weekly chart + Insights
// ══════════════════════════════════════

function drawPage3(doc: jsPDF, data: ReportData) {
  const margin = 20;
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  // ── Weekly stacked bar chart ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(doc, COLORS.midnight);
  doc.text("Evolution hebdomadaire", margin, y + 4);
  y += 14;

  const chartW = pageW - 2 * margin;
  const chartH = 60;
  const weeks = data.weeklyData;

  if (weeks.length > 0) {
    const maxTotal = Math.max(
      ...weeks.map((w) => w.ship + w.verify + w.flag + w.block),
      1
    );
    const barWidth = Math.min(30, (chartW - 10) / weeks.length - 6);
    const spacing = (chartW - weeks.length * barWidth) / (weeks.length + 1);

    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const total = week.ship + week.verify + week.flag + week.block;
      const barH = (total / maxTotal) * chartH;
      const bx = margin + spacing + i * (barWidth + spacing);
      let by = y + chartH - barH;

      // Draw stacked segments
      const segments = [
        { value: week.ship, color: COLORS.mint },
        { value: week.verify, color: COLORS.ocean },
        { value: week.flag, color: COLORS.amber },
        { value: week.block, color: COLORS.rose },
      ];

      for (const seg of segments) {
        if (seg.value > 0) {
          const segH = (seg.value / maxTotal) * chartH;
          setFillColor(doc, seg.color);
          doc.rect(bx, by, barWidth, segH, "F");
          by += segH;
        }
      }

      // Week label below
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setColor(doc, COLORS.fog);
      doc.text(week.label, bx + barWidth / 2, y + chartH + 5, {
        align: "center",
      });

      // Total above bar
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      setColor(doc, COLORS.midnight);
      doc.text(
        String(total),
        bx + barWidth / 2,
        y + chartH - barH - 2,
        { align: "center" }
      );
    }

    // Legend
    y += chartH + 14;
    doc.setFontSize(7);
    let lx = margin;
    const legendItems = [
      { label: "Expedier", color: COLORS.mint },
      { label: "Verifier", color: COLORS.ocean },
      { label: "Signaler", color: COLORS.amber },
      { label: "Bloquer", color: COLORS.rose },
    ];
    for (const item of legendItems) {
      setFillColor(doc, item.color);
      doc.rect(lx, y - 2.5, 3, 3, "F");
      setColor(doc, COLORS.fog);
      doc.setFont("helvetica", "normal");
      doc.text(item.label, lx + 5, y);
      lx += doc.getTextWidth(item.label) + 12;
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    setColor(doc, COLORS.fog);
    doc.text("Aucune donnee hebdomadaire disponible.", margin, y + 5);
    y += chartH;
  }

  y += 18;

  // ── Recommendations / Insights ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(doc, COLORS.midnight);
  doc.text("Recommandations", margin, y + 4);
  y += 12;

  const insights = generateInsights(data);

  if (insights.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    setColor(doc, COLORS.fog);
    doc.text(
      "Pas assez de donnees pour generer des recommandations ce mois.",
      margin,
      y + 4
    );
  } else {
    for (const insight of insights) {
      // Lightbulb bullet
      drawRoundedRect(doc, margin, y, pageW - 2 * margin, 16, 2, COLORS.snow);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setColor(doc, COLORS.amber);
      doc.text("!", margin + 6, y + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setColor(doc, COLORS.midnight);

      // Word-wrap the insight text
      const maxTextW = pageW - 2 * margin - 20;
      const lines = doc.splitTextToSize(insight, maxTextW);
      doc.text(lines, margin + 14, y + 7);

      y += Math.max(16, lines.length * 4 + 10) + 4;
    }
  }

  drawFooter(doc, 3, 3);
}

// ══════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════

export async function generateMonthlyReport(
  data: ReportData
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Page 1
  drawPage1(doc, data);

  // Page 2
  doc.addPage();
  drawPage2(doc, data);

  // Page 3
  doc.addPage();
  drawPage3(doc, data);

  return Buffer.from(doc.output("arraybuffer"));
}
