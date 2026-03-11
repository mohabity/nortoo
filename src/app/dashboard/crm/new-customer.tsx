"use client";

import { useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function NewCustomerModal({ onClose, onCreated }: Props) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/crm/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name: name || undefined, city: city || undefined, address: address || undefined, tags: tags.length > 0 ? tags : undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || (isFr ? "Erreur" : "Error"));
        return;
      }

      onCreated();
    } catch {
      setError(isFr ? "Erreur réseau" : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-fog hover:text-midnight">
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-display text-lg font-bold text-midnight">
          {isFr ? "Nouveau client" : "New customer"}
        </h2>
        <p className="mt-1 text-sm text-fog">
          {isFr ? "Le numéro de téléphone sera haché (SHA-256)" : "Phone number will be hashed (SHA-256)"}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Phone */}
          <div>
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

          {/* Name */}
          <div>
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

          {/* City */}
          <div>
            <label className="text-sm font-medium text-midnight">
              {isFr ? "Ville" : "City"}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={isFr ? "Casablanca, Rabat..." : "Casablanca, Rabat..."}
              className="mt-1 w-full rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium text-midnight">
              {isFr ? "Adresse" : "Address"}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={isFr ? "Adresse de livraison par défaut" : "Default shipping address"}
              className="mt-1 w-full rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-midnight">Tags</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(); }
                }}
                placeholder={isFr ? "vip, fidèle, suspect..." : "vip, loyal, suspect..."}
                className="flex-1 rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {isFr ? "Annuler" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={loading || !phone}
              className="gap-2 bg-mint text-midnight hover:bg-mint/90"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isFr ? "Créer" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
