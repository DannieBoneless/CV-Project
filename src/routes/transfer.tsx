import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp, type Wallet } from "@/context/app-context";
import { fmt } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/transfer")({ component: Transfer });

function Transfer() {
  const { user, internalTransfer } = useApp();
  const [from, setFrom] = useState<Wallet>("main");
  const [to, setTo] = useState<Wallet>("savings");
  const [amount, setAmount] = useState("");
  if (!user) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await internalTransfer(from, to, Number(amount));
      toast.success("Transferred");
      setAmount("");
    } catch (err) { toast.error((err as Error).message); }
  };
  const opts: Wallet[] = ["main", "savings", "investment"];
  return (
    <DashboardShell title="Transfers">
      <div className="mx-auto max-w-md space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {opts.map((w) => (
            <div key={w} className="rounded-xl border p-3 text-center">
              <div className="text-[10px] uppercase text-muted-foreground">{w}</div>
              <div className="mt-1 font-semibold">{fmt(user.balances[w])}</div>
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="glass rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-bold">Move money between your accounts</h2>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">From</span>
            <select value={from} onChange={(e) => setFrom(e.target.value as Wallet)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {opts.map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)} ({fmt(user.balances[o])})</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">To</span>
            <select value={to} onChange={(e) => setTo(e.target.value as Wallet)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {opts.map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}
            </select>
          </label>
          <input type="number" min="1" step="0.01" required placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <button className="w-full rounded-xl gradient-primary py-3 font-medium text-primary-foreground">Transfer instantly</button>
        </form>
      </div>
    </DashboardShell>
  );
}