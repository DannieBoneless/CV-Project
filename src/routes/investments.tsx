import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/investments")({ component: () => (
  <MarketingShell>
    <div className="mx-auto max-w-4xl px-4 py-16 animate-fade-up">
      <h1 className="text-4xl font-bold">Grow your wealth with Vaults</h1>
      <p className="mt-3 text-muted-foreground">Simple, transparent, locked for the term you choose.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[["Starter", 30, 5], ["Growth", 90, 8], ["Legend", 180, 12]].map(([n, d, a]) => (
          <div key={n as string} className="glass rounded-2xl p-6 text-center">
            <div className="text-lg font-bold">{n} Vault</div>
            <div className="text-xs text-muted-foreground">{d as number} days</div>
            <div className="mt-4 text-4xl font-bold text-primary">{a as number}%</div>
            <div className="text-xs text-muted-foreground">APY</div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center"><Link to="/auth" className="rounded-xl gradient-primary px-6 py-3 text-primary-foreground">Get started</Link></div>
    </div>
  </MarketingShell>
) });