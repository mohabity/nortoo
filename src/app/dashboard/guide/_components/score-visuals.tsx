import { cn } from "@/lib/utils";

export function ScoreRangeBar() {
  return (
    <div className="space-y-2">
      <div className="flex rounded-lg overflow-hidden text-xs font-semibold text-white h-10">
        <div className="flex items-center justify-center bg-emerald-500" style={{ width: "30%" }}>
          EXPÉDIER
        </div>
        <div className="flex items-center justify-center bg-amber-500" style={{ width: "35%" }}>
          VÉRIFIER
        </div>
        <div className="flex items-center justify-center bg-rose-500" style={{ width: "20%" }}>
          SIGNALER
        </div>
        <div className="flex items-center justify-center bg-violet-600" style={{ width: "15%" }}>
          BLOQUER
        </div>
      </div>
      <div className="flex text-xs text-fog font-mono">
        <span style={{ width: "30%" }}>0 — 30</span>
        <span style={{ width: "35%" }}>31 — 65</span>
        <span style={{ width: "20%" }}>66 — 85</span>
        <span style={{ width: "15%" }}>86 — 100</span>
      </div>
    </div>
  );
}

export function RuleTable({
  rules,
}: {
  rules: { id: string; points: string; description: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-silk text-left text-xs text-fog font-medium">
            <th className="py-2 pr-3">Règle</th>
            <th className="py-2 pr-3">Points</th>
            <th className="py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} className="border-b border-silk/60">
              <td className="py-2 pr-3 font-mono text-xs text-mint">{r.id}</td>
              <td
                className={cn(
                  "py-2 pr-3 font-mono text-xs font-semibold",
                  r.points.startsWith("-") ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {r.points}
              </td>
              <td className="py-2">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
