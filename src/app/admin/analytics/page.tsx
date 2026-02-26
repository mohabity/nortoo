"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  MousePointerClick,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OverviewKpis {
  totalOrders: number;
  totalScored: number;
  totalConfirmed: number;
  totalRejected: number;
  avgScore: number;
  scoringRate: number;
  mrr: number;
  activeMerchants: number;
}

interface OverviewSeries {
  date: string;
  orders: number;
  confirmed: number;
  rejected: number;
  avgScore: number;
  mrr: number;
  activeMerchants: number;
}

interface BlogKpis {
  totalPageviews: number;
  totalVisitors: number;
  totalCtaClicks: number;
  totalBlogToSignup: number;
  conversionRate: number;
}

interface BlogSeries {
  date: string;
  pageviews: number;
  visitors: number;
  ctaClicks: number;
}

type Range = "7d" | "30d" | "90d";

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-mint/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-mint" />
        </div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-midnight">{value}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overviewKpis, setOverviewKpis] = useState<OverviewKpis | null>(null);
  const [overviewSeries, setOverviewSeries] = useState<OverviewSeries[]>([]);
  const [blogKpis, setBlogKpis] = useState<BlogKpis | null>(null);
  const [blogSeries, setBlogSeries] = useState<BlogSeries[]>([]);

  const fetchData = useCallback(
    async (r: Range) => {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, blogRes] = await Promise.all([
          fetch(`/api/admin/analytics/overview?range=${r}`),
          fetch(`/api/admin/analytics/blog?range=${r}`),
        ]);

        if (overviewRes.status === 401 || blogRes.status === 401) {
          router.push("/admin/login");
          return;
        }

        const overviewData = await overviewRes.json();
        const blogData = await blogRes.json();

        setOverviewKpis(overviewData.kpis);
        setOverviewSeries(overviewData.series ?? []);
        setBlogKpis(blogData.kpis);
        setBlogSeries(blogData.series ?? []);
      } catch {
        setError("Erreur lors du chargement des analytics");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-midnight">
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue globale plateforme + blog
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(["7d", "30d", "90d"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  range === r
                    ? "bg-white text-midnight shadow-sm"
                    : "text-gray-500 hover:text-midnight"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchData(range)}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* ═══ Platform Overview ═══ */}
      <section>
        <h2 className="text-lg font-semibold text-midnight mb-4">
          Plateforme
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            label="Commandes"
            value={overviewKpis?.totalOrders?.toLocaleString() ?? "–"}
            icon={ShoppingCart}
          />
          <KpiCard
            label="Marchands actifs"
            value={overviewKpis?.activeMerchants ?? "–"}
            icon={Users}
          />
          <KpiCard
            label="MRR"
            value={
              overviewKpis?.mrr
                ? `${overviewKpis.mrr.toLocaleString()} DH`
                : "–"
            }
            icon={DollarSign}
          />
          <KpiCard
            label="Score moyen"
            value={overviewKpis?.avgScore ?? "–"}
            icon={TrendingUp}
          />
        </div>

        {/* Orders chart */}
        {overviewSeries.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-700 mb-4">
              Commandes / jour
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={overviewSeries}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5A0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E5A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => d.slice(5)}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#00E5A0"
                  fill="url(#colorOrders)"
                  strokeWidth={2}
                  name="Commandes"
                />
                <Area
                  type="monotone"
                  dataKey="confirmed"
                  stroke="#22C55E"
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  name="Confirmées"
                />
                <Area
                  type="monotone"
                  dataKey="rejected"
                  stroke="#EF4444"
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  name="Rejetées"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ═══ Blog ═══ */}
      <section>
        <h2 className="text-lg font-semibold text-midnight mb-4">Blog</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            label="Pages vues"
            value={blogKpis?.totalPageviews?.toLocaleString() ?? "–"}
            icon={Eye}
          />
          <KpiCard
            label="Visiteurs uniques"
            value={blogKpis?.totalVisitors?.toLocaleString() ?? "–"}
            icon={Users}
          />
          <KpiCard
            label="Clics CTA"
            value={blogKpis?.totalCtaClicks ?? "–"}
            icon={MousePointerClick}
          />
          <KpiCard
            label="Blog → Signup"
            value={
              blogKpis?.conversionRate !== undefined
                ? `${blogKpis.conversionRate}%`
                : "–"
            }
            icon={TrendingUp}
          />
        </div>

        {/* Blog chart */}
        {blogSeries.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-700 mb-4">
              Trafic blog / jour
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={blogSeries}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => d.slice(5)}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="pageviews"
                  fill="#00E5A0"
                  radius={[4, 4, 0, 0]}
                  name="Pages vues"
                />
                <Bar
                  dataKey="visitors"
                  fill="#0B0F1A"
                  radius={[4, 4, 0, 0]}
                  name="Visiteurs"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
