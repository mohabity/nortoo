import { cn } from "@/lib/utils";

// ── Plan Badge ──

const PLAN_STYLES: Record<string, string> = {
  trial:   "bg-fog/15 text-mist border-fog/20",
  starter: "bg-ocean/15 text-ocean border-ocean/20",
  pro:     "bg-violet/15 text-violet border-violet/20",
  scale:   "bg-lime/15 text-lime border-lime/20",
};

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  starter: "Starter",
  pro: "Pro",
  scale: "Scale",
};

export function PlanBadge({ plan }: { plan: string }) {
  const style = PLAN_STYLES[plan] ?? PLAN_STYLES.trial;
  const label = PLAN_LABELS[plan] ?? plan;

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-xs border", style)}>
      {label}
    </span>
  );
}

// ── Status Badge ──

const STATUS_STYLES: Record<string, string> = {
  trial:    "bg-amber/15 text-amber border-amber/20",
  active:   "bg-mint/15 text-mint border-mint/20",
  past_due: "bg-rose/15 text-rose border-rose/20",
  cancelled: "bg-fog/15 text-mist border-fog/20",
};

const STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Active",
  past_due: "Past Due",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.trial;
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-xs border", style)}>
      {label}
    </span>
  );
}
