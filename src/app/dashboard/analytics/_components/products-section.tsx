"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Package,
  AlertTriangle,
  Coins,
  TrendingDown,
} from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { formatCurrency } from "@/lib/i18n-utils";
import type { ProductAnalytics, ProductSortKey, SortDir } from "@/types/analytics";
import { SortableHeader, RtoBar, ProductRiskBadge, TableSkeleton } from "./shared";

interface ProductsSectionProps {
  productData: ProductAnalytics[];
  sortedProducts: ProductAnalytics[];
  productLoading: boolean;
  productError: string | null;
  productSort: ProductSortKey;
  productSortDir: SortDir;
  handleProductSort: (key: ProductSortKey) => void;
  highRiskProducts: ProductAnalytics[];
  revenueAtRisk: number;
  top3RtoConcentration: number;
}

export function ProductsSection({
  productData,
  sortedProducts,
  productLoading,
  productError,
  productSort,
  productSortDir,
  handleProductSort,
  highRiskProducts,
  revenueAtRisk,
  top3RtoConcentration,
}: ProductsSectionProps) {
  const { t, locale } = useTranslation();

  return (
    <Card className="rounded-[18px]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-rose" />
          <CardTitle>{t("analytics.products.title")}</CardTitle>
        </div>
        <p className="text-xs text-fog">{t("analytics.products.subtitle")}</p>
      </CardHeader>
      <CardContent>
        {/* Product mini KPIs */}
        {productLoading ? (
          <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[200px] snap-start lg:min-w-0 h-20 animate-pulse rounded-xl bg-snow" />
            ))}
          </div>
        ) : productError ? null : (
          <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible">
            {/* High-risk product count */}
            <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose" />
                <p className="text-xs font-medium text-fog">{t("analytics.products.highRisk")}</p>
              </div>
              <p className="mt-2 font-display text-xl font-bold text-midnight">
                {highRiskProducts.length}
              </p>
              <p className="text-[11px] text-fog">
                {t("analytics.products.highRiskCriteria")}
              </p>
            </div>

            {/* Revenue at risk */}
            <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber" />
                <p className="text-xs font-medium text-fog">{t("analytics.products.revenueAtRisk")}</p>
              </div>
              <p className="mt-2 font-display text-xl font-bold text-midnight">
                {formatCurrency(revenueAtRisk, locale)}
              </p>
              <p className="text-[11px] text-fog">
                {t("analytics.products.revenueSubtitle")}
              </p>
            </div>

            {/* Top 3 RTO concentration */}
            <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-violet" />
                <p className="text-xs font-medium text-fog">{t("analytics.products.concentratedRto")}</p>
              </div>
              <p className="mt-2 font-display text-xl font-bold text-midnight">
                {top3RtoConcentration}<span className="text-sm font-semibold text-fog">%</span>
              </p>
              <p className="text-[11px] text-fog">
                {t("analytics.products.concentratedSubtitle")}
              </p>
            </div>
          </div>
        )}

        {/* Product table */}
        {productLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : productError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-rose mb-3" />
            <p className="text-sm font-medium text-midnight">{t("analytics.products.loadError")}</p>
            <p className="text-xs text-fog mt-1">{productError}</p>
          </div>
        ) : productData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-8 w-8 text-fog mb-3" />
            <p className="text-sm font-medium text-midnight">{t("analytics.products.noProducts")}</p>
            <p className="text-xs text-fog mt-1">{t("analytics.products.noProductsHint")}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-silk">
                    <SortableHeader<ProductSortKey> label={t("analytics.products.product")} sortKey="productName" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} />
                    <SortableHeader<ProductSortKey> label={t("analytics.products.category")} sortKey="productCategory" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} />
                    <SortableHeader<ProductSortKey> label={t("analytics.products.orders")} sortKey="totalOrders" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} align="right" />
                    <SortableHeader<ProductSortKey> label={t("analytics.products.delivered")} sortKey="deliveredOrders" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} align="right" />
                    <SortableHeader<ProductSortKey> label={t("analytics.products.returns")} sortKey="returnedOrders" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} align="right" />
                    <SortableHeader<ProductSortKey> label={t("analytics.products.rtoRate")} sortKey="rtoRate" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} align="right" />
                    <SortableHeader<ProductSortKey> label={t("analytics.products.totalRevenue")} sortKey="totalRevenue" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} align="right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((p) => (
                    <tr key={p.id} className="border-b border-silk/50 transition-colors hover:bg-snow/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-midnight">{p.productName}</span>
                          <ProductRiskBadge rtoRate={p.rtoRate} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-fog">{p.productCategory}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-slate">{p.totalOrders}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-mint-deep">{p.deliveredOrders}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-rose">{p.returnedOrders}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RtoBar value={Math.round(p.rtoRate * 100)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm font-semibold text-midnight">
                          {formatCurrency(p.totalRevenue, locale)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {sortedProducts.map((p) => (
                <div key={p.id} className="rounded-sm border border-silk bg-white p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-body text-sm font-semibold text-midnight">{p.productName}</p>
                      <p className="text-xs text-fog mt-0.5">{p.productCategory}</p>
                    </div>
                    <ProductRiskBadge rtoRate={p.rtoRate} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-fog">{t("analytics.products.rtoRate")}</span>
                      <RtoBar value={Math.round(p.rtoRate * 100)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-t border-silk pt-3">
                    <div className="flex-1">
                      <p className="text-[11px] text-fog">{t("analytics.products.orders")}</p>
                      <p className="font-mono text-sm font-bold text-slate">{p.totalOrders}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-fog">{t("analytics.products.delivered")}</p>
                      <p className="font-mono text-sm font-bold text-mint-deep">{p.deliveredOrders}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-fog">{t("analytics.products.returns")}</p>
                      <p className="font-mono text-sm font-bold text-rose">{p.returnedOrders}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-[11px] text-fog">{t("analytics.products.totalRevenue")}</p>
                      <p className="font-mono text-sm font-bold text-midnight">{formatCurrency(p.totalRevenue, locale)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
