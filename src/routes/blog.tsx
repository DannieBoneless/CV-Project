import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
export const Route = createFileRoute("/blog")({ component: () => (
  <MarketingShell><div className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-4xl font-bold">Blog</h1><div className="mt-6 space-y-4">{[["The 5-minute guide to Vaults", "APY, terms, and compounding."], ["Send money globally without the fees", "Honest transfers."], ["Building your first emergency fund", "The simple 3-step system."]].map(([t, d]) => (<article key={t} className="glass rounded-xl p-6"><h3 className="text-lg font-semibold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></article>))}</div></div></MarketingShell>
) });