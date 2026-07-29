import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { fmt, shortDate } from "@/lib/format";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, Send, Plus, CreditCard, TrendingUp, Inbox, Eye, EyeOff } from "lucide-react";
import { GreetingWeather } from "@/components/greeting-weather";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, txs } = useApp();
  const [hidden, setHidden] = useState(false);
  if (!user) return null;
  const mask = (v: string) => (hidden ? "••••••" : v);
  const spending = txs.filter((t) => t.type !== "deposit" && t.status !== "failed").reduce((s, t) => s + t.amount, 0);
  const pie = [
    { name: "Bills", value: spending * 0.35 || 40 },
    { name: "Groceries", value: spending * 0.25 || 30 },
    { name: "Entertainment", value: spending * 0.2 || 20 },
    { name: "Other", value: spending * 0.2 || 10 },
  ];
  const colors = ["oklch(0.55 0.2 260)", "oklch(0.72 0.16 165)", "oklch(0.75 0.15 85)", "oklch(0.55 0.18 300)"];
  const canBonus = user.hasDeposited === false;
  return (
    <DashboardShell title="Overview">
      <div className="space-y-5">
        <GreetingWeather name={user.firstName || user.email.split("@")[0]} />
        <div className="rounded-2xl gradient-card p-6 text-white shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-80">Main balance</div>
              <div className="mt-1 text-4xl font-bold">{mask(fmt(user.balances.main))}</div>
              <div className="mt-1 text-xs opacity-70">{user.email}</div>
            </div>
            <button
              onClick={() => setHidden((h) => !h)}
              aria-label={hidden ? "Show balances" : "Hide balances"}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20"
            >
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <Mini label="Savings" value={mask(fmt(user.balances.savings))} />
            <Mini label="Investment" value={mask(fmt(user.balances.investment))} />
          </div>
        </div>

        {canBonus && (
          <Link to="/deposit" className="block rounded-2xl gradient-emerald p-5 text-white shadow-elegant animate-pulse-glow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-90">Welcome bonus</div>
                <div className="text-lg font-semibold">Get a free $200 bonus on your first $100 deposit!</div>
              </div>
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </Link>
        )}

        <div className="grid grid-cols-4 gap-3">
          <Quick to="/send" i={Send} label="Send" />
          <Quick to="/deposit" i={Plus} label="Deposit" />
          <Quick to="/cards" i={CreditCard} label="Cards" />
          <Quick to="/invest" i={TrendingUp} label="Invest" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Spending</h3>
              <Link to="/analytics" className="text-xs text-primary">View all</Link>
            </div>
            <div className="mt-2 h-52">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} innerRadius={45} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pie.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {pie.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: colors[i] }} /> {s.name}
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Recent transactions</h3>
              <Link to="/transactions" className="text-xs text-primary">View all</Link>
            </div>
            {txs.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                <Inbox className="h-10 w-10 opacity-50" />
                <p className="mt-3 text-sm">No transactions yet. Make your first deposit to get started!</p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {txs.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <div className="font-medium">{t.note}</div>
                      <div className="text-xs text-muted-foreground">{shortDate(t.at)} · <span className={t.status === "failed" ? "text-destructive" : t.status === "pending" ? "text-accent" : "text-emerald-500"}>{t.status}</span></div>
                    </div>
                    <div className={t.status === "failed" ? "text-muted-foreground line-through" : ""}>{fmt(t.amount)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Quick({ to, i: I, label }: { to: string; i: any; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-xs transition hover:shadow-elegant hover:-translate-y-0.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground">
        <I className="h-4 w-4" />
      </div>
      {label}
    </Link>
  );
}