"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/provider";
import { tooltipStyle } from "./shared";

interface DecisionDataItem {
  nameKey: string;
  value: number;
  pct: number;
  color: string;
  name: string;
}

interface DecisionBreakdownChartProps {
  decisionData: DecisionDataItem[];
}

export function DecisionBreakdownChart({ decisionData }: DecisionBreakdownChartProps) {
  const { t } = useTranslation();

  return (
    <Card className="rounded-[18px]">
      <CardHeader>
        <CardTitle>{t("analytics.decisionBreakdown.title")}</CardTitle>
        <p className="text-xs text-fog">{t("analytics.decisionBreakdown.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row h-auto lg:h-[280px] items-center gap-4 lg:gap-8">
          <div className="relative h-[200px] lg:h-full w-full lg:w-auto flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={decisionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {decisionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [`${value} ${t("analytics.financial.orderCount")}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-mono text-2xl font-bold text-midnight">542</p>
              <p className="text-[10px] text-fog">{t("analytics.decisionBreakdown.total")}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 lg:flex-col lg:flex-nowrap lg:justify-start">
            {decisionData.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <div>
                  <p className="text-sm font-medium text-slate">{d.name}</p>
                  <p className="text-xs text-fog">
                    <span className="font-mono font-bold text-midnight">{d.value}</span>
                    {" "}&middot; {d.pct}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
