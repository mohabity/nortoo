"use client";

import {
  Shield,
  Eye,
  Trash2,
  Ban,
  RefreshCw,
  Settings,
  LogIn,
  Download,
  FileText,
} from "lucide-react";

// ── Types ──

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface DataRightsRequest {
  id: number;
  requesterPhoneHash: string;
  rightType: string;
  status: string;
  responseDeadline: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface AccessResult {
  customer: {
    phoneLast4: string;
    name: string;
    city: string;
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
    isOpposed: boolean;
    firstSeen: string;
    lastSeen: string;
  };
  orders: Array<{
    id: number;
    ref: string;
    total: number;
    currency: string;
    city: string;
    fraudScore: number;
    decision: string;
    createdAt: string;
  }>;
}

export interface PaginationMeta {
  page: number;
  totalPages: number;
}

// ── Config maps ──

export const rightTypeConfig: Record<
  string,
  { key: string; icon: typeof Eye; variant: "ocean" | "rose" | "violet" }
> = {
  access: { key: "compliance.rights.access", icon: Eye, variant: "ocean" },
  deletion: { key: "compliance.rights.deletion", icon: Trash2, variant: "rose" },
  opposition: { key: "compliance.rights.objection", icon: Ban, variant: "violet" },
};

export const statusConfig: Record<
  string,
  { key: string; variant: "mint" | "amber" | "default" | "rose" }
> = {
  pending: { key: "compliance.rights.statusPending", variant: "amber" },
  processing: { key: "compliance.rights.statusInProgress", variant: "amber" },
  completed: { key: "compliance.rights.statusProcessed", variant: "mint" },
  refused: { key: "compliance.rights.statusRejected", variant: "rose" },
};

export const actionConfig: Record<string, { key: string; icon: typeof Shield }> = {
  score: { key: "compliance.audit.scoring", icon: Shield },
  override: { key: "compliance.audit.override", icon: RefreshCw },
  access_request: { key: "compliance.audit.accessRequest", icon: Eye },
  data_rights_access: { key: "compliance.audit.accessRequest", icon: Eye },
  data_rights_delete: { key: "compliance.audit.deletion", icon: Trash2 },
  data_rights_oppose: { key: "compliance.audit.objection", icon: Ban },
  delete: { key: "compliance.audit.deletion", icon: Trash2 },
  data_purge: { key: "compliance.audit.deletion", icon: Trash2 },
  settings_change: { key: "compliance.audit.settings", icon: Settings },
  login: { key: "compliance.audit.login", icon: LogIn },
  export: { key: "compliance.audit.export", icon: Download },
  analytics_exported: { key: "compliance.audit.export", icon: Download },
  report_exported: { key: "compliance.audit.export", icon: Download },
};

export const actorKeys: Record<string, string> = {
  system: "compliance.audit.system",
  merchant: "compliance.audit.merchant",
  consumer: "compliance.audit.consumer",
  admin: "compliance.audit.admin",
};
