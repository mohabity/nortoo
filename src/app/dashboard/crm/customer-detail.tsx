"use client";

import { type ComponentType, useEffect, useState, useCallback } from "react";
import {
  X,
  Loader2,
  ShoppingCart,
  MessageSquare,
  User,
  MapPin,
  Phone,
  Tag,
  Plus,
  Pencil,
  Save,
  Package,
  Truck,
  RotateCcw,
  CheckCircle,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { NewOrderModal } from "./new-order";

interface CustomerOrder {
  id: number;
  externalRef: string | null;
  productName: string | null;
  total: number;
  fraudScore: number;
  decision: string;
  overrideDecision: string | null;
  deliveryStatus: string;
  source: string | null;
  createdAt: string;
}

interface Note {
  id: number;
  content: string;
  type: string;
  authorName: string | null;
  createdAt: string;
}

interface CustomerData {
  id: number;
  phoneHash: string;
  phoneLast4: string | null;
  name: string | null;
  city: string | null;
  address: string | null;
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  tags: string[];
  status: string;
  source: string;
  firstSeen: string;
  lastSeen: string;
}

interface Props {
  customerId: number;
  onClose: () => void;
  onUpdate: () => void;
}

const DELIVERY_STATUS_ICON: Record<string, ComponentType<{ className?: string }>> = {
  pending: Clock,
  shipped: Truck,
  delivered: CheckCircle,
  returned: RotateCcw,
};

const DELIVERY_STATUS_COLOR: Record<string, string> = {
  pending: "text-gray-500",
  shipped: "text-blue-600",
  delivered: "text-emerald-600",
  returned: "text-red-600",
};

const SCORE_COLOR = (score: number) => {
  if (score <= 30) return "bg-emerald-100 text-emerald-800";
  if (score <= 65) return "bg-amber-100 text-amber-800";
  if (score <= 85) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
};

export function CustomerDetail({ customerId, onClose, onUpdate }: Props) {
  const { locale } = useTranslation();
  const { addToast } = useToast();
  const isFr = locale === "fr";

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<{ avgScore: number; deliveryRate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "notes" | "info">("orders");
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [updatingDelivery, setUpdatingDelivery] = useState<number | null>(null);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/customers/${customerId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCustomer(data.customer);
      setOrders(data.orders);
      setStats(data.stats);
    } catch {
      addToast({ message: isFr ? "Erreur de chargement" : "Loading error", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [customerId, isFr, addToast]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/customers/${customerId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } catch { /* ignore */ }
  }, [customerId]);

  useEffect(() => { fetchCustomer(); fetchNotes(); }, [fetchCustomer, fetchNotes]);

  useEffect(() => {
    if (customer) {
      setEditName(customer.name ?? "");
      setEditCity(customer.city ?? "");
      setEditAddress(customer.address ?? "");
      setEditStatus(customer.status);
      setEditTags(customer.tags);
    }
  }, [customer]);

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName || undefined,
          city: editCity || undefined,
          address: editAddress || undefined,
          status: editStatus,
          tags: editTags,
        }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      fetchCustomer();
      onUpdate();
      addToast({ message: isFr ? "Client mis à jour" : "Customer updated", type: "success" });
    } catch {
      addToast({ message: isFr ? "Erreur" : "Error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/crm/customers/${customerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (!res.ok) throw new Error();
      setNewNote("");
      fetchNotes();
    } catch {
      addToast({ message: isFr ? "Erreur" : "Error", type: "error" });
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeliveryUpdate = async (orderId: number, status: string) => {
    setUpdatingDelivery(orderId);
    try {
      const res = await fetch(`/api/crm/orders/${orderId}/delivery`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        addToast({ message: data.error || "Error", type: "error" });
        return;
      }
      fetchCustomer();
      onUpdate();
      addToast({ message: isFr ? "Statut mis à jour" : "Status updated", type: "success" });
    } catch {
      addToast({ message: isFr ? "Erreur" : "Error", type: "error" });
    } finally {
      setUpdatingDelivery(null);
    }
  };

  const addEditTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !editTags.includes(tag)) setEditTags([...editTags, tag]);
    setTagInput("");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <Loader2 className="h-8 w-8 animate-spin text-mint" />
      </div>
    );
  }

  if (!customer) return null;

  const deliveryRate = customer.totalOrders > 0
    ? Math.round((customer.successfulOrders / customer.totalOrders) * 100)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Slide-over */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-silk bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-bg text-sm font-bold text-mint-deep">
                {customer.name ? customer.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-midnight">
                  {customer.name || (isFr ? "Sans nom" : "No name")}
                </h2>
                <div className="flex items-center gap-2 text-xs text-mist">
                  {customer.phoneLast4 && <span>····{customer.phoneLast4}</span>}
                  {customer.city && <><span>·</span><span>{customer.city}</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              <button onClick={onClose} className="text-fog hover:text-midnight">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            <div className="rounded bg-snow p-2 text-center">
              <p className="text-lg font-bold text-midnight">{customer.totalOrders}</p>
              <p className="text-[10px] text-mist">{isFr ? "Commandes" : "Orders"}</p>
            </div>
            <div className="rounded bg-snow p-2 text-center">
              <p className="text-lg font-bold text-emerald-600">{customer.successfulOrders}</p>
              <p className="text-[10px] text-mist">{isFr ? "Livrées" : "Delivered"}</p>
            </div>
            <div className="rounded bg-snow p-2 text-center">
              <p className="text-lg font-bold text-red-600">{customer.failedOrders}</p>
              <p className="text-[10px] text-mist">{isFr ? "Retours" : "Returns"}</p>
            </div>
            <div className="rounded bg-snow p-2 text-center">
              <p className={cn("text-lg font-bold", deliveryRate >= 70 ? "text-emerald-600" : deliveryRate >= 40 ? "text-amber-600" : "text-red-600")}>
                {customer.totalOrders > 0 ? `${deliveryRate}%` : "—"}
              </p>
              <p className="text-[10px] text-mist">{isFr ? "Taux" : "Rate"}</p>
            </div>
          </div>

          {/* New order button */}
          <Button
            className="mt-3 w-full gap-2 bg-mint text-midnight hover:bg-mint/90"
            onClick={() => setShowNewOrder(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            {isFr ? "Nouvelle commande" : "New order"}
          </Button>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="border-b border-silk bg-mint-bg/20 p-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-fog">{isFr ? "Nom" : "Name"}</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 w-full rounded border border-silk px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-fog">{isFr ? "Ville" : "City"}</label>
                <input value={editCity} onChange={(e) => setEditCity(e.target.value)} className="mt-1 w-full rounded border border-silk px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-fog">{isFr ? "Adresse" : "Address"}</label>
              <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="mt-1 w-full rounded border border-silk px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-fog">{isFr ? "Statut" : "Status"}</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="mt-1 w-full rounded border border-silk px-2 py-1.5 text-sm">
                <option value="active">{isFr ? "Actif" : "Active"}</option>
                <option value="inactive">{isFr ? "Inactif" : "Inactive"}</option>
                <option value="blacklisted">{isFr ? "Blacklisté" : "Blacklisted"}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-fog">Tags</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEditTag(); } }}
                  placeholder="vip, fidèle..."
                  className="flex-1 rounded border border-silk px-2 py-1.5 text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={addEditTag}><Plus className="h-3 w-3" /></Button>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {editTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {tag}
                    <button onClick={() => setEditTags(editTags.filter((t) => t !== tag))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>{isFr ? "Annuler" : "Cancel"}</Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="gap-1 bg-mint text-midnight hover:bg-mint/90">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {isFr ? "Sauvegarder" : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-silk">
          {(["orders", "notes", "info"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-3 text-center text-sm font-medium transition-colors",
                tab === t
                  ? "border-b-2 border-mint text-mint-deep"
                  : "text-fog hover:text-midnight"
              )}
            >
              {t === "orders" ? (isFr ? "Commandes" : "Orders") :
               t === "notes" ? "Notes" :
               (isFr ? "Infos" : "Info")}
              {t === "orders" && ` (${orders.length})`}
              {t === "notes" && ` (${notes.length})`}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="py-8 text-center text-sm text-fog">
                  {isFr ? "Aucune commande" : "No orders yet"}
                </p>
              ) : (
                orders.map((order) => {
                  const StatusIcon = DELIVERY_STATUS_ICON[order.deliveryStatus] ?? Clock;
                  const statusColor = DELIVERY_STATUS_COLOR[order.deliveryStatus] ?? "text-gray-500";
                  const finalDecision = order.overrideDecision || order.decision;
                  return (
                    <div key={order.id} className="rounded-lg border border-silk p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("rounded px-1.5 py-0.5 text-xs font-mono font-medium", SCORE_COLOR(order.fraudScore))}>
                            {order.fraudScore}
                          </span>
                          <span className="text-sm font-medium text-midnight">
                            {order.externalRef || `#${order.id}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className={cn("h-4 w-4", statusColor)} />
                          <span className={cn("text-xs font-medium", statusColor)}>
                            {order.deliveryStatus}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-fog">
                        <span>{order.productName || "—"}</span>
                        <span className="font-medium text-midnight">{order.total} DH</span>
                      </div>
                      <div className="mt-1 text-xs text-mist">
                        {new Date(order.createdAt).toLocaleDateString(locale === "fr" ? "fr-MA" : "en-US")}
                      </div>

                      {/* Delivery actions */}
                      {order.deliveryStatus !== "delivered" && order.deliveryStatus !== "returned" && (
                        <div className="mt-2 flex gap-2">
                          {order.deliveryStatus === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              disabled={updatingDelivery === order.id}
                              onClick={() => handleDeliveryUpdate(order.id, "shipped")}
                            >
                              {updatingDelivery === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
                              {isFr ? "Expédié" : "Shipped"}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 text-emerald-600 hover:bg-emerald-50"
                            disabled={updatingDelivery === order.id}
                            onClick={() => handleDeliveryUpdate(order.id, "delivered")}
                          >
                            {updatingDelivery === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                            {isFr ? "Livré" : "Delivered"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 text-red-600 hover:bg-red-50"
                            disabled={updatingDelivery === order.id}
                            onClick={() => handleDeliveryUpdate(order.id, "returned")}
                          >
                            {updatingDelivery === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                            {isFr ? "Retourné" : "Returned"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-4">
              {/* Add note */}
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                  placeholder={isFr ? "Ajouter une note..." : "Add a note..."}
                  className="flex-1 rounded-md border border-silk px-3 py-2 text-sm focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={savingNote || !newNote.trim()}
                  className="bg-mint text-midnight hover:bg-mint/90"
                  size="sm"
                >
                  {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              {/* Notes timeline */}
              {notes.length === 0 ? (
                <p className="py-8 text-center text-sm text-fog">
                  {isFr ? "Aucune note" : "No notes yet"}
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-silk p-3">
                      <div className="flex items-center justify-between text-xs text-mist">
                        <span className="font-medium text-fog">{note.authorName || "—"}</span>
                        <span>{new Date(note.createdAt).toLocaleString(locale === "fr" ? "fr-MA" : "en-US")}</span>
                      </div>
                      <p className="mt-1 text-sm text-midnight">{note.content}</p>
                      {note.type !== "note" && (
                        <span className="mt-1 inline-block rounded-full bg-snow px-2 py-0.5 text-xs text-fog">{note.type}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-mist">{isFr ? "Téléphone" : "Phone"}</p>
                  <p className="font-medium text-midnight">····{customer.phoneLast4 || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-mist">{isFr ? "Ville" : "City"}</p>
                  <p className="font-medium text-midnight">{customer.city || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-mist">{isFr ? "Adresse" : "Address"}</p>
                  <p className="font-medium text-midnight">{customer.address || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-mist">{isFr ? "Source" : "Source"}</p>
                  <p className="font-medium text-midnight">{customer.source}</p>
                </div>
                <div>
                  <p className="text-xs text-mist">{isFr ? "Statut" : "Status"}</p>
                  <p className="font-medium text-midnight capitalize">{customer.status}</p>
                </div>
                <div>
                  <p className="text-xs text-mist">{isFr ? "Premier contact" : "First seen"}</p>
                  <p className="font-medium text-midnight">
                    {new Date(customer.firstSeen).toLocaleDateString(locale === "fr" ? "fr-MA" : "en-US")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-mist">{isFr ? "Dernière activité" : "Last seen"}</p>
                  <p className="font-medium text-midnight">
                    {new Date(customer.lastSeen).toLocaleDateString(locale === "fr" ? "fr-MA" : "en-US")}
                  </p>
                </div>
                {stats && (
                  <div>
                    <p className="text-xs text-mist">{isFr ? "Score moyen" : "Avg score"}</p>
                    <p className="font-medium text-midnight">{stats.avgScore}/100</p>
                  </div>
                )}
              </div>
              {customer.tags.length > 0 && (
                <div>
                  <p className="text-xs text-mist mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New order modal from customer detail */}
      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          onCreated={() => {
            setShowNewOrder(false);
            fetchCustomer();
            onUpdate();
          }}
          prefillPhone=""
          prefillName={customer.name ?? ""}
          prefillCity={customer.city ?? ""}
          prefillAddress={customer.address ?? ""}
        />
      )}
    </>
  );
}
