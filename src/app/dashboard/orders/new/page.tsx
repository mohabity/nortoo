"use client";

import { useState } from "react";
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

const DECISION_CONFIG = {
  ship: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  verify: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  flag: { icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  block: { icon: XCircle, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
} as const;

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

  const canSubmit = phone.trim().length >= 5 && parseFloat(total) > 0;

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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0612345678"
                className="w-full rounded-sm border border-silk bg-white px-3 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
                required
                autoFocus
              />
            </div>

            {/* Total */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
                <DollarSign className="h-3.5 w-3.5 text-mint" />
                {t("manualOrder.total")} (DH) *
              </label>
              <input
                type="number"
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

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit || submitting}
          className="w-full"
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
