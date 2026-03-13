"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/provider";
import { RtoTooltip } from "./shared";

interface DailyDataPoint {
  rawDate: string;
  date: string;
  fullDate: string;
  orders: number;
  delivered: number;
  returns: number;
  rtoRate: number;
}

interface RtoTrendChartProps {
  dailyData: DailyDataPoint[];
  period: "7j" | "30j" | "90j";
  baseline: number;
}

export function RtoTrendChart({ dailyData, period, baseline }: RtoTrendChartProps) {
  const { t } = useTranslation();

  return (
    <Card className="rounded-[18px]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{t("analytics.charts.rtoTrend")}</CardTitle>
          <p className="mt-1 text-xs text-fog">
            {t("analytics.charts.rtoTrendSubtitle")} ({baseline}%)
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] lg:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="rtoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                interval={period === "7j" ? 0 : period === "30j" ? 4 : 13}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 50]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<RtoTooltip />} />
              <ReferenceLine
                y={baseline}
                stroke="#94A3B8"
                strokeDasharray="6 4"
                label={{
                  value: t("analytics.charts.baseline", { value: baseline }),
                  position: "right",
                  fontSize: 11,
                  fill: "#94A3B8",
                }}
              />
              <Area
                type="monotone"
                dataKey="rtoRate"
                stroke="#F43F5E"
                strokeWidth={2.5}
                fill="url(#rtoGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#F43F5E", stroke: "#fff", strokeWidth: 2 }}
                name={t("analytics.charts.rtoRate")}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
