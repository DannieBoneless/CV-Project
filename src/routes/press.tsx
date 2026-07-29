import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
export const Route = createFileRoute("/press")({ component: () => (
  <MarketingShell><div className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-4xl font-bold">Press</h1><p className="mt-3 text-muted-foreground">press@crestvest.com</p><div className="mt-6 space-y-3">{["CrestVest surpasses 2M customers","Series C: $180M raised","Launch of Legend Vault at 12% APY"].map((t) => <div key={t} className="glass rounded-xl p-5">{t}</div>)}</div></div></MarketingShell>
) });