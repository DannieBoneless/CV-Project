import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp, type Trade } from "@/context/app-context";
import { fmt, shortDate } from "@/lib/format";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Lock, Plus, ArrowLeftRight, X } from "lucide-react";

export const Route = createFileRoute("/invest")({
  head: () => ({
    meta: [
      { title: "Investment Account — CrestVest Inc." },
      { name: "description", content: "Open and close trades, transfer between Main and Investment accounts, and grow with vaults." },
      { property: "og:title", content: "Investment Account — CrestVest" },
      { property: "og:description", content: "Trade live markets and manage your investment balance." },
    ],
  }),
  component: Invest,
});

type Asset = { sym: string; name: string; price: number };
const MARKET: Asset[] = [
  { sym: "AAPL", name: "Apple Inc.", price: 189.4 },
  { sym: "MSFT", name: "Microsoft", price: 412.3 },
  { sym: "TSLA", name: "Tesla", price: 241.7 },
  { sym: "NVDA", name: "NVIDIA", price: 132.1 },
  { sym: "HYDF", name: "High-Yield Dollar Fund", price: 100 },
];

const VAULTS = [
  { plan: "Starter" as const, days: 30, apy: 5 },
  { plan: "Growth" as const, days: 90, apy: 8 },
  { plan: "Legend" as const, days: 180, apy: 12 },
];

function Invest() {
  const { user, trades, vaults, buyVault, addFundsToInvest, moveInvestToMain, openTrade, closeTrade } = useApp();
  const [prices, setPrices] = useState<Record<string, number>>(() => Object.fromEntries(MARKET.map((a) => [a.sym, a.price])));
  const [prev, setPrev] = useState<Record<string, number>>({});
  const [openVault, setOpenVault] = useState<null | typeof VAULTS[number]>(null);
  const [vaultAmt, setVaultAmt] = useState("");
  const [moveOpen, setMoveOpen] = useState<null | "in" | "out">(null);
  const [moveAmt, setMoveAmt] = useState("");
  const [tradeModal, setTradeModal] = useState<null | { asset: Asset; side: "buy" | "sell" }>(null);
  const [qty, setQty] = useState("1");

  useEffect(() => {
    const id = setInterval(() => {
      setPrices((p) => {
        setPrev(p);
        const next: Record<string, number> = {};
        for (const a of MARKET) {
          const drift = (Math.random() - 0.48) * 0.012;
          next[a.sym] = Math.max(1, +(p[a.sym] * (1 + drift)).toFixed(2));
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const openTrades = trades.filter((t) => t.status === "open");
  const closedTrades = trades.filter((t) => t.status === "closed");

  const stats = useMemo(() => {
    const openValue = openTrades.reduce((s, t) => {
      const cur = prices[t.sym] ?? t.openPrice;
      const raw = (cur - t.openPrice) * t.qty;
      const pnl = t.side === "buy" ? raw : -raw;
      return s + t.qty * t.openPrice + pnl;
    }, 0);
    const invested = openTrades.reduce((s, t) => s + t.qty * t.openPrice, 0);
    const profit = closedTrades.filter((t) => (t.pnl ?? 0) >= 0).reduce((s, t) => s + (t.pnl ?? 0), 0);
    const loss = closedTrades.filter((t) => (t.pnl ?? 0) < 0).reduce((s, t) => s + Math.abs(t.pnl ?? 0), 0);
    const total = (user?.balances.investment ?? 0) + openValue;
    return { openValue, invested, profit, loss, total };
  }, [openTrades, closedTrades, prices, user?.balances.investment]);

  if (!user) return null;

  const doOpen = async () => {
    if (!tradeModal) return;
    const q = Number(qty);
    if (!q || q <= 0) return toast.error("Invalid quantity");
    try {
      await openTrade({ sym: tradeModal.asset.sym, name: tradeModal.asset.name, side: tradeModal.side, qty: q, price: prices[tradeModal.asset.sym] });
      toast.success("Trade opened");
      setTradeModal(null); setQty("1");
    } catch (e) { toast.error((e as Error).message); }
  };
  const doClose = async (t: Trade) => {
    try {
      await closeTrade(t.id, prices[t.sym] ?? t.openPrice);
      toast.success("Trade closed");
    } catch (e) { toast.error((e as Error).message); }
  };
  const doMove = async () => {
    const amt = Number(moveAmt);
    try {
      if (moveOpen === "in") await addFundsToInvest(amt);
      else await moveInvestToMain(amt);
      toast.success("Transferred");
      setMoveOpen(null); setMoveAmt("");
    } catch (e) { toast.error((e as Error).message); }
  };
  const confirmVault = async () => {
    if (!openVault) return;
    try { await buyVault(openVault.plan, Number(vaultAmt)); toast.success("Vault opened"); setOpenVault(null); setVaultAmt(""); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <DashboardShell title="Investment Account">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Portfolio value" value={fmt(stats.total)} />
          <Stat label="Available cash" value={fmt(user.balances.investment)} />
          <Stat label="Invested" value={fmt(stats.invested)} />
          <Stat label="Total profit" value={fmt(stats.profit)} tone="up" />
          <Stat label="Total loss" value={fmt(stats.loss)} tone="down" />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMoveOpen("in")} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-primary"><Plus className="h-3 w-3" /> Main → Investment</button>
          <button onClick={() => setMoveOpen("out")} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs"><ArrowLeftRight className="h-3 w-3" /> Investment → Main</button>
        </div>

        <div className="glass rounded-2xl">
          <div className="border-b px-5 py-3 text-sm font-semibold">Live market</div>
          <ul className="divide-y">
            {MARKET.map((a) => {
              const cur = prices[a.sym];
              const p = prev[a.sym] ?? cur;
              const up = cur >= p;
              return (
                <li key={a.sym} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-sm sm:flex sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{a.sym} <span className="text-xs text-muted-foreground">· {a.name}</span></div>
                  </div>
                  <div className={`flex items-center gap-1 font-mono ${up ? "text-emerald-500" : "text-destructive"}`}>
                    {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} {fmt(cur)}
                  </div>
                  <div className="col-span-2 flex gap-2 sm:col-span-1">
                    <button onClick={() => { setTradeModal({ asset: a, side: "buy" }); setQty("1"); }} className="rounded-md gradient-primary px-3 py-1 text-xs text-primary-foreground">Buy</button>
                    <button onClick={() => { setTradeModal({ asset: a, side: "sell" }); setQty("1"); }} className="rounded-md border px-3 py-1 text-xs">Sell</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass rounded-2xl">
          <div className="border-b px-5 py-3 text-sm font-semibold">Open trades ({openTrades.length})</div>
          {openTrades.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No open positions. Buy or Sell an asset above to open one.</div>
          ) : (
            <ul className="divide-y">
              {openTrades.map((t) => {
                const cur = prices[t.sym] ?? t.openPrice;
                const raw = (cur - t.openPrice) * t.qty;
                const pnl = t.side === "buy" ? raw : -raw;
                const pnlPct = (pnl / (t.qty * t.openPrice)) * 100;
                const up = pnl >= 0;
                return (
                  <li key={t.id} className="grid grid-cols-2 gap-2 px-5 py-4 text-sm sm:flex sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold">{t.side.toUpperCase()} {t.qty} {t.sym}</div>
                      <div className="text-xs text-muted-foreground">Open {fmt(t.openPrice)} · {shortDate(t.openAt)}</div>
                    </div>
                    <div className="text-right sm:text-left">
                      <div className="text-xs text-muted-foreground">Now</div>
                      <div className="font-mono">{fmt(cur)}</div>
                    </div>
                    <div className={`text-right font-mono ${up ? "text-emerald-500" : "text-destructive"}`}>
                      {up ? "+" : "-"}{fmt(Math.abs(pnl))}<div className="text-xs">{pnlPct.toFixed(2)}%</div>
                    </div>
                    <div className="text-right">
                      <button onClick={() => doClose(t)} className="rounded-md gradient-primary px-3 py-1.5 text-xs text-primary-foreground">Close</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {closedTrades.length > 0 && (
          <div className="glass rounded-2xl">
            <div className="border-b px-5 py-3 text-sm font-semibold">Closed trades</div>
            <ul className="divide-y">
              {closedTrades.map((t) => {
                const up = (t.pnl ?? 0) >= 0;
                return (
                  <li key={t.id} className="grid grid-cols-2 gap-2 px-5 py-4 text-sm sm:grid-cols-5">
                    <div className="col-span-2 sm:col-span-1">
                      <div className="font-semibold">{t.side.toUpperCase()} {t.qty} {t.sym}</div>
                      <div className="text-xs text-muted-foreground">Closed {shortDate(t.closeAt!)}</div>
                    </div>
                    <div><div className="text-xs text-muted-foreground">Open</div><div className="font-mono">{fmt(t.openPrice)}</div></div>
                    <div><div className="text-xs text-muted-foreground">Close</div><div className="font-mono">{fmt(t.closePrice ?? 0)}</div></div>
                    <div className={`col-span-2 text-right sm:col-span-2 sm:text-right font-mono ${up ? "text-emerald-500" : "text-destructive"}`}>
                      {up ? "+" : "-"}{fmt(Math.abs(t.pnl ?? 0))} <span className="text-xs">({(t.pnlPct ?? 0).toFixed(2)}%)</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div>
          <h3 className="mb-3 font-semibold">Grow your wealth — Vaults</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {VAULTS.map((v) => (
              <div key={v.plan} className="glass rounded-2xl p-5">
                <div className="text-lg font-bold">{v.plan} Vault</div>
                <div className="text-xs text-muted-foreground">{v.days} days · {v.apy}% APY</div>
                <div className="mt-4 text-3xl font-bold text-primary">{v.apy}%</div>
                <button onClick={() => setOpenVault(v)} className="mt-4 w-full rounded-lg gradient-primary py-2 text-sm font-medium text-primary-foreground">Invest now</button>
              </div>
            ))}
          </div>
        </div>

        {vaults.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">Active vaults</h3>
            <div className="space-y-3">
              {vaults.map((v) => {
                const elapsed = (Date.now() - new Date(v.startAt).getTime()) / (1000 * 60 * 60 * 24);
                const pct = Math.min(100, (elapsed / v.days) * 100);
                return (
                  <div key={v.id} className="glass rounded-2xl p-5">
                    <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{v.plan} Vault</span><span className="text-sm text-muted-foreground">{fmt(v.principal)} · {v.apy}% APY</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full gradient-primary" style={{ width: `${pct}%` }} /></div>
                    <div className="mt-1 text-xs text-muted-foreground">{Math.max(0, Math.ceil(v.days - elapsed))} days remaining</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {tradeModal && (
        <Modal onClose={() => setTradeModal(null)}>
          <h3 className="text-lg font-bold">{tradeModal.side === "buy" ? "Buy" : "Sell"} {tradeModal.asset.sym}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Price: {fmt(prices[tradeModal.asset.sym])}</p>
          <label className="mt-3 block text-xs text-muted-foreground">Quantity</label>
          <input type="number" min="0.0001" step="0.0001" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <div className="mt-2 text-xs text-muted-foreground">Cost: {fmt((Number(qty) || 0) * prices[tradeModal.asset.sym])}</div>
          <div className="mt-1 text-xs text-muted-foreground">Available: {fmt(user.balances.investment)}</div>
          <button onClick={doOpen} className="mt-4 w-full rounded-lg gradient-primary py-3 font-medium text-primary-foreground">Confirm {tradeModal.side === "buy" ? "Buy" : "Sell"}</button>
        </Modal>
      )}
      {moveOpen && (
        <Modal onClose={() => setMoveOpen(null)}>
          <h3 className="text-lg font-bold">{moveOpen === "in" ? "Main → Investment" : "Investment → Main"}</h3>
          <input type="number" min="1" value={moveAmt} onChange={(e) => setMoveAmt(e.target.value)} className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Amount" />
          <button onClick={doMove} className="mt-4 w-full rounded-lg gradient-primary py-3 font-medium text-primary-foreground">Transfer</button>
        </Modal>
      )}
      {openVault && (
        <Modal onClose={() => setOpenVault(null)}>
          <div className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /><h3 className="text-lg font-bold">Open {openVault.plan} Vault</h3></div>
          <p className="mt-1 text-sm text-muted-foreground">Amount to lock ($)</p>
          <input type="number" min="1" value={vaultAmt} onChange={(e) => setVaultAmt(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <p className="mt-2 text-xs text-accent-foreground bg-accent/20 rounded p-2">Funds are locked until maturity ({openVault.days} days).</p>
          <div className="mt-1 text-xs text-muted-foreground">Investment cash available: {fmt(user.balances.investment)}</div>
          <button onClick={confirmVault} className="mt-4 w-full rounded-lg gradient-primary py-3 font-medium text-primary-foreground">Confirm & Purchase</button>
        </Modal>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "text-emerald-500" : tone === "down" ? "text-destructive" : "";
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-elegant animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        {children}
      </div>
    </div>
  );
}