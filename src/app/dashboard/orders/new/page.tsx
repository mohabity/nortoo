"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  User,
  MapPin,
  DollarSign,
  Package,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Plus,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";

interface ScoringResult {
  success: boolean;
  ref: string;
  orderId: number;
  score: number;
  decision: string;
  riskLevel: string;
  factors: { rule: string; points: number; reason: string }[];
  confidence: number;
  pipelineStatus: string;
  reviewDeadline: string | null;
}

interface CustomerLookup {
  found: boolean;
  name?: string;
  city?: string;
  phoneLast4?: string;
  totalOrders?: number;
  successfulOrders?: number;
  failedOrders?: number;
  lastAddress?: string | null;
}

interface RecentPhone {
  phone: string;
  name: string;
  city: string;
  last4: string;
  address?: string;
}

const DECISION_CONFIG = {
  ship: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  verify: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  flag: { icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  block: { icon: XCircle, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
} as const;

const STORAGE_KEY = "nortoo_recent_phones";
const MAX_RECENT = 10;

function getRecentPhones(): RecentPhone[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentPhone(entry: RecentPhone) {
  try {
    const existing = getRecentPhones().filter((p) => p.last4 !== entry.last4);
    const updated = [entry, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable
  }
}

export default function NewManualOrderPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [total, setTotal] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoringResult | null>(null);

  // Customer lookup state
  const [lookupResult, setLookupResult] = useState<CustomerLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recent customers chips
  const [recentPhones, setRecentPhones] = useState<RecentPhone[]>([]);
  const [showRecent, setShowRecent] = useState(true);

  // Load recent phones from localStorage on mount
  useEffect(() => {
    setRecentPhones(getRecentPhones());
  }, []);

  const canSubmit = phone.trim().length >= 5 && parseFloat(total) > 0;

  // Debounced customer lookup
  const lookupCustomer = useCallback(async (phoneValue: string) => {
    if (phoneValue.trim().length < 5) {
      setLookupResult(null);
      return;
    }

    setLookupLoading(true);
    try {
      const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(phoneValue.trim())}`);
      const data: CustomerLookup = await res.json();
      setLookupResult(data);

      // Auto-fill empty fields if customer found
      if (data.found) {
        setCustomerName((prev) => prev || data.name || "");
        setCity((prev) => prev || data.city || "");
        setAddress((prev) => prev || data.lastAddress || "");
      }
    } catch {
      // Silent fail — don't block the form
    } finally {
      setLookupLoading(false);
    }
  }, []);

  function handlePhoneChange(value: string) {
    setPhone(value);
    setLookupResult(null);
    setShowRecent(!value);

    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);

    if (value.trim().length >= 5) {
      lookupTimerRef.current = setTimeout(() => lookupCustomer(value), 600);
    }
  }

  function handleSelectRecent(recent: RecentPhone) {
    setPhone(recent.phone);
    setCustomerName(recent.name || "");
    setCity(recent.city || "");
    setAddress(recent.address || "");
    setShowRecent(false);
    // Trigger lookup for this phone
    lookupCustomer(recent.phone);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          customerName: customerName.trim() || undefined,
          total: parseFloat(total),
          city: city.trim() || undefined,
          address: address.trim() || undefined,
          product: product.trim() || undefined,
          quantity: quantity ? parseInt(quantity, 10) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("manualOrder.error"));
        return;
      }

      setResult(data);

      // Save to recent phones for chips
      const digits = phone.trim().replace(/\D/g, "");
      saveRecentPhone({
        phone: phone.trim(),
        name: customerName.trim(),
        city: city.trim(),
        last4: digits.slice(-4),
        address: address.trim() || undefined,
      });
    } catch {
      setError(t("manualOrder.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewOrder() {
    setPhone("");
    setCustomerName("");
    setTotal("");
    setCity("");
    setAddress("");
    setProduct("");
    setQuantity("");
    setResult(null);
    setError(null);
    setLookupResult(null);
    setShowRecent(true);
    setRecentPhones(getRecentPhones());
  }

  // ── Result view ──
  if (result) {
    const decision = result.decision as keyof typeof DECISION_CONFIG;
    const config = DECISION_CONFIG[decision] || DECISION_CONFIG.verify;
    const Icon = config.icon;

    return (
      <div className="mx-auto max-w-lg space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewOrder}
            className="rounded-sm p-1.5 hover:bg-snow transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-fog" />
          </button>
          <h1 className="font-display text-xl font-bold text-midnight">
            {t("manualOrder.result")}
          </h1>
        </div>

        {/* Score card */}
        <Card className={`${config.border} border-2`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${config.bg}`}>
                  <Icon className={`h-6 w-6 ${config.color}`} />
                </div>
                <div>
                  <p className="text-sm text-fog">{t("manualOrder.ref")}: {result.ref}</p>
                  <p className={`font-display text-lg font-bold ${config.color}`}>
                    {t(`decisions.${decision}`)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold text-midnight">
                  {result.score}
                </p>
                <p className="text-xs text-fog">/100</p>
              </div>
            </div>

            {/* Confidence */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-fog mb-1">
                <span>{t("manualOrder.confidence")}</span>
                <span>{Math.round(result.confidence)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-snow">
                <div
                  className="h-1.5 rounded-full bg-mint transition-all"
                  style={{ width: `${result.confidence}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Factors */}
        {result.factors.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("manualOrder.factors")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.factors.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-snow last:border-0"
                >
                  <span className="text-slate">{f.reason}</span>
                  <span
                    className={`font-mono text-xs font-medium ${
                      f.points > 0
                        ? "text-rose-600"
                        : f.points < 0
                        ? "text-emerald-600"
                        : "text-fog"
                    }`}
                  >
                    {f.points > 0 ? "+" : ""}
                    {f.points}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleNewOrder} className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            {t("manualOrder.addAnother")}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/dashboard/orders?selected=${result.orderId}`)}
          >
            {t("manualOrder.viewOrder")}
          </Button>
        </div>
      </div>
    );
  }

  // ── Form view ──
  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/orders"
          className="rounded-sm p-1.5 hover:bg-snow transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-fog" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-midnight">
            {t("manualOrder.title")}
          </h1>
          <p className="text-sm text-fog">{t("manualOrder.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Phone + Total — required */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
                <Phone className="h-3.5 w-3.5 text-mint" />
                {t("manualOrder.phone")} *
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="0612345678"
                className="w-full rounded-sm border border-silk bg-white px-3 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
                required
                autoFocus
              />

              {/* Customer lookup badge */}
              {lookupLoading && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-fog">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("manualOrder.lookingUp")}
                </div>
              )}
              {lookupResult?.found && !lookupLoading && (
                <div className={`mt-1.5 flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1.5 ${
                  (lookupResult.failedOrders ?? 0) > (lookupResult.successfulOrders ?? 0)
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}>
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                  <span>
                    {t("manualOrder.knownCustomer")} — {lookupResult.totalOrders} {t("manualOrder.orders")}, {lookupResult.successfulOrders} {t("manualOrder.delivered")}
                  </span>
                </div>
              )}

              {/* Recent customers chips */}
              {showRecent && recentPhones.length > 0 && !phone && (
                <div className="mt-2">
                  <p className="text-xs text-fog mb-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t("manualOrder.recentCustomers")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentPhones.slice(0, 5).map((r) => (
                      <button
                        key={r.last4}
                        type="button"
                        onClick={() => handleSelectRecent(r)}
                        className="inline-flex items-center gap-1 rounded-full border border-silk bg-snow px-3 py-1.5 text-xs text-slate hover:border-mint hover:bg-mint/5 transition-colors"
                      >
                        <span className="text-fog">••{r.last4}</span>
                        {r.name && <span className="font-medium">{r.name}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
                <DollarSign className="h-3.5 w-3.5 text-mint" />
                {t("manualOrder.total")} (DH) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="349"
                min="1"
                step="0.01"
                className="w-full rounded-sm border border-silk bg-white px-3 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer info — optional */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <p className="text-xs font-medium text-fog uppercase tracking-wider">
              {t("manualOrder.customerInfo")}
            </p>

            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
                <User className="h-3.5 w-3.5 text-fog" />
                {t("manualOrder.name")}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ahmed Benali"
                className="w-full rounded-sm border border-silk bg-white px-3 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
              />
            </div>

            {/* City */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-fog" />
                {t("manualOrder.city")}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Casablanca"
                className="w-full rounded-sm border border-silk bg-white px-3 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
              />
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-fog" />
                {t("manualOrder.address")}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Hay Hassani, Rue 12, N 45"
                className="w-full rounded-sm border border-silk bg-white px-3 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product info — optional */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <p className="text-xs font-medium text-fog uppercase tracking-wider">
              {t("manualOrder.productInfo")}
            </p>

            {/* Product */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
                <Package className="h-3.5 w-3.5 text-fog" />
                {t("manualOrder.product")}
              </label>
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Crème anti-rides"
                className="w-full rounded-sm border border-silk bg-white px-3 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
                <Package className="h-3.5 w-3.5 text-fog" />
                {t("manualOrder.quantity")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full rounded-sm border border-silk bg-white px-3 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Submit — larger on mobile */}
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit || submitting}
          className="w-full py-3.5 text-base md:py-2.5 md:text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("manualOrder.scoring")}
            </>
          ) : (
            t("manualOrder.submit")
          )}
        </Button>
      </form>
    </div>
  );
}
