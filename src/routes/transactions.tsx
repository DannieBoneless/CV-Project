import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp, type TxType } from "@/context/app-context";
import { fmt, shortDate } from "@/lib/format";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transaction History — CrestVest Inc." },
      { name: "description", content: "Full history: trades, transfers, savings, loans, and payments." },
      { property: "og:title", content: "Transactions — CrestVest" },
      { property: "og:description", content: "Every movement across your CrestVest accounts." },
    ],
  }),
  component: Transactions,
});

const FILTERS: { key: "all" | "trade" | "invest" | "savings" | "loan" | "other"; label: string; types: TxType[] | null }[] = [
  { key: "all", label: "All", types: null },
  { key: "trade", label: "Trades", types: ["trade-open", "trade-close"] },
  { key: "invest", label: "Transfers", types: ["invest-transfer", "transfer", "send", "external_send"] },
  { key: "savings", label: "Savings", types: ["savings-deposit", "savings-auto", "savings-withdraw", "goal-created", "goal-completed"] },
  { key: "loan", label: "Loans", types: ["loan", "loan-submitted", "loan-approved", "loan-declined", "loan-disbursed", "loan-payment"] },
  { key: "other", label: "Other", types: ["deposit", "withdraw", "vault", "store"] },
];

function typeLabel(t: TxType) {
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Transactions() {
  const { txs, goals, loans } = useApp();
  const [filter, setFilter] = useState<typeof FILTERS[number]["key"]>("all");
  const list = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter);
    if (!f || !f.types) return txs;
    return txs.filter((t) => f.types!.includes(t.type));
  }, [txs, filter]);

  return (
    <DashboardShell title="Transactions">
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-full px-3 py-1 text-xs ${filter === f.key ? "gradient-primary text-primary-foreground" : "border"}`}>{f.label}</button>
        ))}
      </div>
      <div className="glass rounded-2xl">
        {list.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No transactions in this view.</div>
        ) : (
          <ul className="divide-y">
            {list.map((t) => {
              const related = t.goalId ? goals.find((g) => g.id === t.goalId)?.name : t.loanId ? `Loan ${t.loanId.slice(0, 6)}` : t.from || t.to ? `${t.from ?? ""}${t.from && t.to ? " → " : ""}${t.to ?? ""}` : "";
              return (
                <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 px-5 py-4 text-sm sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{t.note}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString()} · <span className="uppercase">{typeLabel(t.type)}</span></div>
                  </div>
                  <div className="hidden text-xs text-muted-foreground sm:block">
                    <div>Ref</div>
                    <div className="font-mono text-foreground">{t.ref}</div>
                  </div>
                  <div className="hidden text-xs text-muted-foreground sm:block">
                    <div>Related</div>
                    <div className="truncate text-foreground">{related || "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className={t.status === "failed" ? "line-through text-muted-foreground" : "font-semibold"}>{fmt(t.amount)}</div>
                    <div className={`text-xs ${t.status === "failed" ? "text-destructive" : t.status === "pending" ? "text-accent" : "text-emerald-500"}`}>{t.status}</div>
                  </div>
                  <div className="col-span-2 text-[10px] text-muted-foreground sm:hidden">Ref {t.ref}{related ? ` · ${related}` : ""} · {shortDate(t.at)}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}