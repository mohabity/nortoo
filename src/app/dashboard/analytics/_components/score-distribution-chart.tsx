"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/provider";
import { tooltipStyle } from "./shared";

interface ScoreDistributionItem {
  range: string;
  labelKey: string;
  count: number;
  color: string;
  label: string;
}

interface ScoreDistributionChartProps {
  scoreDistribution: ScoreDistributionItem[];
}

export function ScoreDistributionChart({ scoreDistribution }: ScoreDistributionChartProps) {
  const { t } = useTranslation();

  return (
    <Card className="rounded-[18px]">
      <CardHeader>
        <CardTitle>{t("analytics.scoreDistribution.title")}</CardTitle>
        <p className="text-xs text-fog">{t("analytics.scoreDistribution.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] lg:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDistribution} barSize={48} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(0,0,0,.03)" }}
                formatter={(value: number) => [`${value} ${t("analytics.scoreDistribution.orders")}`, t("analytics.products.orders")]}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} name={t("analytics.products.orders")}>
                {scoreDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {scoreDistribution.map((s) => (
            <div key={s.range} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-fog">{s.range}</span>
              <span className="font-mono text-xs font-bold text-slate">{s.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
