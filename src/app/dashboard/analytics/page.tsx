"use client";

import {
  Download,
  FileText,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { FeatureGate } from "@/components/feature-gate";
import { useTranslation } from "@/i18n/provider";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import { PeriodSelector } from "./_components/shared";
import { KpiCards } from "./_components/kpi-cards";
import { FinancialImpact } from "./_components/financial-impact";
import { RtoTrendChart } from "./_components/rto-trend-chart";
import { ScoreDistributionChart } from "./_components/score-distribution-chart";
import { DecisionBreakdownChart } from "./_components/decision-breakdown-chart";
import { ProductsSection } from "./_components/products-section";
import { CitiesSection } from "./_components/cities-section";
import { ZonesSection } from "./_components/zones-section";
import { HourlyPatternsChart } from "./_components/hourly-patterns-chart";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const data = useAnalyticsData();

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-midnight">{t("analytics.title")}</h1>
          <p className="text-sm text-fog">
            {t("analytics.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector value={data.period} onChange={data.setPeriod} />
          {/* Export CSV — Starter+ */}
          <FeatureGate feature="csv_export" mode="lock">
            <button
              onClick={data.handleExportAnalytics}
              disabled={data.exportLoading}
              className="h-9 inline-flex items-center gap-2 rounded-full border border-silk bg-white px-4 text-sm font-medium text-slate hover:bg-snow transition-colors disabled:opacity-50 shrink-0"
            >
              {data.exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{t("analytics.export.button")}</span>
            </button>
          </FeatureGate>

          {/* PDF Report dropdown — Pro+ */}
          <FeatureGate feature="pdf_report" mode="lock">
            <div className="relative">
              <button
                onClick={() => data.setPdfDropdownOpen(!data.pdfDropdownOpen)}
                disabled={data.pdfLoading}
                className="h-9 inline-flex items-center gap-2 rounded-full border border-silk bg-white px-4 text-sm font-medium text-slate hover:bg-snow transition-colors disabled:opacity-50 shrink-0"
              >
                {data.pdfLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{t("analytics.export.pdfReport")}</span>
                <ChevronDown className="h-3 w-3 text-mist" />
              </button>

              {data.pdfDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => data.setPdfDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-sm border border-silk bg-white shadow-lg">
                    <div className="px-3 py-2 border-b border-silk">
                      <p className="text-xs font-medium text-fog">{t("analytics.export.chooseMonth")}</p>
                    </div>
                    {data.pdfMonths.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => data.handleDownloadPDF(m.value)}
                        disabled={data.pdfLoading}
                        className="w-full text-left px-3 py-2 text-sm text-midnight hover:bg-snow transition-colors first-letter:uppercase disabled:opacity-50"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </FeatureGate>
        </div>
      </div>

      {/* ═══ 1. KPI ROW ═══ */}
      <KpiCards
        savingsData={data.savingsData}
        savings={data.savings}
        savingsChange={data.savingsChange}
        rtoRate={data.rtoRate}
        rtoDelta={data.rtoDelta}
        baseline={data.baseline}
        deliveryRate={data.deliveryRate}
        totalDelivered={data.totalDelivered}
        roiDisplay={data.roiDisplay}
      />

      {/* ═══ IMPACT FINANCIER ═══ */}
      {data.savingsData && !data.savingsLoading && (
        <FinancialImpact savingsData={data.savingsData} />
      )}

      {/* ═══ 2. RTO TREND LINE CHART ═══ */}
      <RtoTrendChart
        dailyData={data.dailyData}
        period={data.period}
        baseline={data.baseline}
      />

      {/* ═══ ROW: SCORE DISTRIBUTION + DECISIONS ═══ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ScoreDistributionChart scoreDistribution={data.scoreDistribution} />
        <DecisionBreakdownChart decisionData={data.decisionData} />
      </div>

      {/* ═══ PRODUCTS SECTION ═══ */}
      <ProductsSection
        productData={data.productData}
        sortedProducts={data.sortedProducts}
        productLoading={data.productLoading}
        productError={data.productError}
        productSort={data.productSort}
        productSortDir={data.productSortDir}
        handleProductSort={data.handleProductSort}
        highRiskProducts={data.highRiskProducts}
        revenueAtRisk={data.revenueAtRisk}
        top3RtoConcentration={data.top3RtoConcentration}
      />

      {/* ═══ CITY ANALYSIS TABLE ═══ */}
      <CitiesSection
        cityData={data.cityData}
        sortedCities={data.sortedCities}
        cityLoading={data.cityLoading}
        cityError={data.cityError}
        citySort={data.citySort}
        citySortDir={data.citySortDir}
        handleCitySort={data.handleCitySort}
      />

      {/* ═══ ZONE ANALYSIS ═══ */}
      <ZonesSection
        zoneData={data.zoneData}
        sortedZones={data.sortedZones}
        zoneLoading={data.zoneLoading}
        zoneError={data.zoneError}
        zoneSort={data.zoneSort}
        zoneSortDir={data.zoneSortDir}
        handleZoneSort={data.handleZoneSort}
        zoneCities={data.zoneCities}
        zoneCityFilter={data.zoneCityFilter}
        setZoneCityFilter={data.setZoneCityFilter}
        criticalZones={data.criticalZones}
        safeZones={data.safeZones}
      />

      {/* ═══ HOURLY PATTERNS ═══ */}
      <HourlyPatternsChart />
    </div>
  );
}
