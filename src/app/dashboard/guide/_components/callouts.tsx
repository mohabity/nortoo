import { Lightbulb, AlertTriangle, Info } from "lucide-react";

export function GuideSection({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint/10 text-mint">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="font-display text-xl font-bold text-midnight">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-slate leading-relaxed">{children}</div>
    </section>
  );
}

export function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-mint/20 bg-mint/5 p-4 text-sm">
      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-mint" />
      <div>{children}</div>
    </div>
  );
}

export function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-amber-400/20 bg-amber-50 p-4 text-sm">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
      <div>{children}</div>
    </div>
  );
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-sky-400/20 bg-sky-50 p-4 text-sm">
      <Info className="h-4 w-4 mt-0.5 shrink-0 text-sky-500" />
      <div>{children}</div>
    </div>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-[#0B0F1A] text-gray-100 p-4 text-xs font-mono overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}
