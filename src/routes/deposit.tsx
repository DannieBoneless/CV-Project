import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { Copy, Timer, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/deposit")({ component: Deposit });

const METHODS = [
  { id: "btc", label: "Bitcoin (BTC)", address: "16smVemz2puQdz3mLHycctNs3zFu5qBdA" },
  { id: "usdt", label: "USDT (ERC20)", address: "0xff4e07ba89394f4f2fa04ce292d0f15d6f260240" },
  { id: "bank", label: "Bank Transfer", address: "Chase • Acct 0034 5218 9942 • Routing 021000021 • CrestVest Inc." },
  { id: "cashapp", label: "Cash App", address: "$CrestVestPay" },
] as const;

function useTimer(seconds: number) {
  const [s, setS] = useState(seconds);
  useEffect(() => { const t = setInterval(() => setS((x) => Math.max(0, x - 1)), 1000); return () => clearInterval(t); }, []);
  const m = Math.floor(s / 60), ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

function Deposit() {
  const { deposit } = useApp();
  const [tab, setTab] = useState<typeof METHODS[number]["id"]>("btc");
  const [amount, setAmount] = useState("");
  const timer = useTimer(300);
  const method = METHODS.find((m) => m.id === tab)!;

  const copy = () => { navigator.clipboard.writeText(method.address); toast.success("Copied"); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    await deposit(method.label, Number(amount));
    toast.success("Deposit submitted — pending verification");
    setAmount("");
  };

  return (
    <DashboardShell title="Deposit">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <button key={m.id} onClick={() => setTab(m.id)} className={`rounded-full border px-3 py-1.5 text-xs ${tab === m.id ? "gradient-primary text-primary-foreground border-transparent" : ""}`}>{m.label}</button>
          ))}
        </div>
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Send to the {method.label} address below</span>
            <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {timer}</span>
          </div>
          <div className="rounded-xl border border-dashed p-4">
            <div className="text-xs text-muted-foreground">Address</div>
            <div className="mt-1 break-all font-mono text-sm">{method.address}</div>
            <button onClick={copy} className="mt-2 inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs"><Copy className="h-3 w-3" /> Copy</button>
          </div>
          {(tab === "btc" || tab === "usdt") && (
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">QR placeholder</div>
          )}
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount deposited (USD)</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" step="0.01" required className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <a href="https://wa.me/2347045510914?text=I%20am%20uploading%20my%20deposit%20proof" target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-input py-2 text-sm"><Upload className="h-4 w-4" /> Send proof via WhatsApp</a>
            <button className="w-full rounded-xl gradient-primary py-3 font-medium text-primary-foreground">Mark deposit as sent</button>
            <p className="text-center text-xs text-muted-foreground">Deposits remain "Pending Verification" until confirmed.</p>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}