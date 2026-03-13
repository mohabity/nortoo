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
import { Clock } from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { tooltipStyle } from "./shared";
import { hourlyData } from "./constants";

export function HourlyPatternsChart() {
  const { t } = useTranslation();

  return (
    <Card className="rounded-[18px]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-fog" />
            {t("analytics.hourly.title")}
          </CardTitle>
          <p className="mt-1 text-xs text-fog">
            {t("analytics.hourly.subtitle")}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] lg:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="orders"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="risk"
                orientation="right"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 60]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => {
                  if (name === t("analytics.products.orders")) return [value, name];
                  return [`${value}%`, t("analytics.hourly.riskRate")];
                }}
              />
              <Bar
                yAxisId="orders"
                dataKey="orders"
                radius={[4, 4, 0, 0]}
                name={t("analytics.products.orders")}
                barSize={16}
              >
                {hourlyData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.hourNum >= 1 && entry.hourNum <= 5 ? "#F43F5E" : "#3B82F6"}
                    fillOpacity={0.7}
                  />
                ))}
              </Bar>
              <Bar
                yAxisId="risk"
                dataKey="riskRate"
                radius={[4, 4, 0, 0]}
                name={t("analytics.hourly.riskRate")}
                barSize={16}
                fillOpacity={0.25}
              >
                {hourlyData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.hourNum >= 1 && entry.hourNum <= 5 ? "#F43F5E" : "#94A3B8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-5 border-t border-silk pt-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-full bg-ocean/70" />
            <span className="text-xs text-fog">{t("analytics.hourly.dayOrders")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-full bg-rose/70" />
            <span className="text-xs text-fog">{t("analytics.hourly.nightOrders")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-full bg-mist/25" />
            <span className="text-xs text-fog">{t("analytics.hourly.riskRate")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
