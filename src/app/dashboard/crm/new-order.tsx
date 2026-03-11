"use client";

import { type ComponentType, useState } from "react";
import { X, Loader2, ShieldCheck, AlertTriangle, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onCreated: () => void;
  prefillPhone?: string;
  prefillName?: string;
  prefillCity?: string;
  prefillAddress?: string;
}

interface ScoringResult {
  orderId: number;
  score: number;
  decision: string;
  riskLevel: string;
  factors: { rule: string; points: number; reason: string }[];
  confidence: number;
  pipelineStatus: string;
}

const DECISION_CONFIG: Record<string, { icon: ComponentType<{ className?: string }>; color: string; bg: string }> = {
  ship: { icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  verify: { icon: ShieldCheck, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  flag: { icon: AlertTriangle, color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  block: { icon: Ban, color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

export function NewOrderModal({ onClose, onCreated, prefillPhone, prefillName, prefillCity, prefillAddress }: Props) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScoringResult | null>(null);

  const [phone, setPhone] = useState(prefillPhone ?? "");
  const [name, setName] = useState(prefillName ?? "");
  const [city, setCity] = useState(prefillCity ?? "");
  const [address, setAddress] = useState(prefillAddress ?? "");
  const [product, setProduct] = useState("");
  const [total, setTotal] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/crm/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: name || undefined,
          city: city || undefined,
          address: address || undefined,
          product: product || undefined,
          total: parseFloat(total),
          quantity: parseInt(quantity, 10) || 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isFr ? "Erreur" : "Error"));
        return;
      }

      setResult(data.data);
    } catch {
      setError(isFr ? "Erreur réseau" : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const decisionCfg = result ? DECISION_CONFIG[result.decision] ?? DECISION_CONFIG.verify : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-fog hover:text-midnight">
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-display text-lg font-bold text-midnight">
          {isFr ? "Nouvelle commande" : "New order"}
        </h2>
        <p className="mt-1 text-sm text-fog">
          {isFr
            ? "La commande sera scorée automatiquement"
            : "The order will be automatically scored"}
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Customer info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-midnight">
                  {isFr ? "Téléphone *" : "Phone *"}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0612345678"
                  required
                  className="mt-1 w-full rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-midnight">
                  {isFr ? "Nom" : "Name"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isFr ? "Nom du client" : "Customer name"}
                  className="mt-1 w-full rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>
            </div>

            {/* Delivery */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-midnight">
                  {isFr ? "Ville" : "City"}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Casablanca"
                  className="mt-1 w-full rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-midnight">
                  {isFr ? "Adresse" : "Address"}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isFr ? "Quartier, rue..." : "District, street..."}
                  className="mt-1 w-full rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>
            </div>

            {/* Product */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <label className="text-sm font-medium text-midnight">
                  {isFr ? "Produit" : "Product"}
                </label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder={isFr ? "Nom du produit" : "Product name"}
                  className="mt-1 w-full rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-midnight">
                  {isFr ? "Montant (DH) *" : "Amount (DH) *"}
                </label>
                <input
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="299"
                  required
                  min="1"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-midnight">
                  {isFr ? "Quantité" : "Quantity"}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="mt-1 w-full rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {isFr ? "Annuler" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={loading || !phone || !total}
                className="gap-2 bg-mint text-midnight hover:bg-mint/90"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isFr ? "Scorer & Créer" : "Score & Create"}
              </Button>
            </div>
          </form>
        ) : (
          /* Scoring result */
          <div className="mt-4 space-y-4">
            {/* Decision banner */}
            <div className={cn("rounded-lg border p-4 text-center", decisionCfg?.bg)}>
              {decisionCfg && <decisionCfg.icon className={cn("mx-auto h-8 w-8", decisionCfg.color)} />}
              <p className={cn("mt-2 font-display text-xl font-bold", decisionCfg?.color)}>
                {result.decision.toUpperCase()}
              </p>
              <p className="mt-1 text-3xl font-bold text-midnight">{result.score}/100</p>
              <p className="text-sm text-fog">
                {isFr ? `Confiance: ${Math.round(result.confidence * 100)}%` : `Confidence: ${Math.round(result.confidence * 100)}%`}
              </p>
            </div>

            {/* Factors */}
            {result.factors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-midnight mb-2">
                  {isFr ? "Facteurs de scoring" : "Scoring factors"}
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded bg-snow px-3 py-1.5 text-xs">
                      <span className="text-fog">{f.reason}</span>
                      <span className={cn("font-mono font-medium", f.points > 0 ? "text-red-600" : f.points < 0 ? "text-emerald-600" : "text-fog")}>
                        {f.points > 0 ? "+" : ""}{f.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                {isFr ? "Fermer" : "Close"}
              </Button>
              <Button
                onClick={() => {
                  onCreated();
                }}
                className="bg-mint text-midnight hover:bg-mint/90"
              >
                {isFr ? "OK" : "Done"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
