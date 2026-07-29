import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { fmt } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/store")({ component: Store });

const ITEMS = [
  { id: "guide-1", name: "Investing 101 eBook", price: 19 },
  { id: "guide-2", name: "Wealth Playbook", price: 49 },
  { id: "concierge", name: "Priority Concierge (30d)", price: 99 },
  { id: "upgrade-gold", name: "Upgrade to Gold Tier", price: 149 },
  { id: "upgrade-legend", name: "Upgrade to Legend Tier", price: 299 },
  { id: "planner", name: "1:1 Financial Planning Call", price: 199 },
];

function Store() {
  const { user, storePurchase } = useApp();
  if (!user) return null;
  const buy = async (item: typeof ITEMS[number]) => {
    try { await storePurchase(item.name, item.price); toast.success(`Purchased ${item.name}`); }
    catch (e) { toast.error((e as Error).message); }
  };
  return (
    <DashboardShell title="Store">
      <div className="mb-4 rounded-2xl gradient-primary p-4 text-primary-foreground">
        <div className="text-xs opacity-90">CrestVest card balance</div>
        <div className="text-2xl font-bold">{fmt(user.cardBalance)}</div>
        <div className="text-xs opacity-80">Card-only purchases — no external checkout.</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ITEMS.map((it) => (
          <div key={it.id} className="glass rounded-2xl p-5">
            <div className="font-semibold">{it.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">{fmt(it.price)}</div>
            <button onClick={() => buy(it)} className="mt-3 w-full rounded-lg gradient-primary py-2 text-sm font-medium text-primary-foreground">Buy with card</button>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}