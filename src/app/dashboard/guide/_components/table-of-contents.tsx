import { cn } from "@/lib/utils";
import { SECTIONS } from "./guide-config";

export function TableOfContents({
  activeId,
  onSelect,
  className,
}: {
  activeId: string;
  onSelect?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("space-y-0.5", className)}>
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const active = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => {
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
              onSelect?.();
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left",
              active
                ? "bg-mint/10 text-mint font-medium"
                : "text-fog hover:bg-gray-50 hover:text-slate"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}
