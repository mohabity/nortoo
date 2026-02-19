"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TrendingDown, Target, DollarSign, BarChart3 } from "lucide-react";

const rtoData = [
  { month: "Sep", rto: 42, livré: 58 },
  { month: "Oct", rto: 38, livré: 62 },
  { month: "Nov", rto: 35, livré: 65 },
  { month: "Déc", rto: 30, livré: 70 },
  { month: "Jan", rto: 25, livré: 75 },
  { month: "Fév", rto: 22, livré: 78 },
];

const scoreDistribution = [
  { range: "0-20", count: 145 },
  { range: "21-40", count: 89 },
  { range: "41-60", count: 52 },
  { range: "61-80", count: 28 },
  { range: "81-100", count: 12 },
];

const decisionData = [
  { name: "Expédier", value: 312, color: "#34D399" },
  { name: "Vérifier", value: 89, color: "#F59E0B" },
  { name: "Signaler", value: 28, color: "#F97066" },
  { name: "Bloquer", value: 12, color: "#8B5CF6" },
];

const roiData = [
  { month: "Sep", perdu: 15200, économisé: 0 },
  { month: "Oct", perdu: 12800, économisé: 2400 },
  { month: "Nov", perdu: 9500, économisé: 5700 },
  { month: "Déc", perdu: 7200, économisé: 8000 },
  { month: "Jan", perdu: 5800, économisé: 9400 },
  { month: "Fév", perdu: 4100, économisé: 11100 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sora text-2xl font-bold text-ink-1">Analytique</h1>
        <p className="text-sm text-ink-3">Performance anti-fraude et ROI</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Taux RTO actuel"
          value="22%"
          change="-20 pts depuis activation"
          changeType="positive"
          icon={TrendingDown}
          iconColor="text-mint"
        />
        <KpiCard
          title="Précision scoring"
          value="87%"
          change="Sur les 30 derniers jours"
          changeType="neutral"
          icon={Target}
          iconColor="text-ocean"
        />
        <KpiCard
          title="Économies estimées"
          value="11 100 DH"
          change="Ce mois-ci"
          changeType="positive"
          icon={DollarSign}
          iconColor="text-sun"
        />
        <KpiCard
          title="Commandes scorées"
          value="441"
          change="Ce mois-ci"
          changeType="neutral"
          icon={BarChart3}
          iconColor="text-violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* RTO Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du taux RTO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rtoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D8" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#78716C" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#78716C" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E7E0D8",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="livré" fill="#34D399" radius={[4, 4, 0, 0]} name="Livré %" />
                  <Bar dataKey="rto" fill="#F97066" radius={[4, 4, 0, 0]} name="RTO %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Decision Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des décisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center gap-6">
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={decisionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {decisionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E7E0D8",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {decisionData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-sm text-ink-2">{d.name}</span>
                    <span className="font-mono text-sm font-bold text-ink-1">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D8" />
                  <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#78716C" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#78716C" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E7E0D8",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Commandes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ROI Chart */}
        <Card>
          <CardHeader>
            <CardTitle>ROI — Pertes vs Économies (DH)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D8" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#78716C" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#78716C" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E7E0D8",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => `${value.toLocaleString()} DH`}
                  />
                  <Line
                    type="monotone"
                    dataKey="perdu"
                    stroke="#F97066"
                    strokeWidth={2}
                    dot={{ fill: "#F97066" }}
                    name="Pertes RTO"
                  />
                  <Line
                    type="monotone"
                    dataKey="économisé"
                    stroke="#34D399"
                    strokeWidth={2}
                    dot={{ fill: "#34D399" }}
                    name="Économisé"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
