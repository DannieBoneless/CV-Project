import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/features")({ component: () => (
  <MarketingShell>
    <div className="mx-auto max-w-4xl px-4 py-16 animate-fade-up">
      <h1 className="text-4xl font-bold">Features built for the way you bank</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[["Multi-wallet accounts", "Main, savings, and investment in one place."],["Instant internal transfers", "Move money between wallets — no fees."],["Vaults with real APY", "Lock funds 30/90/180 days at 5/8/12%."],["Live trading dashboard", "Buy and sell in seconds."],["Closed-loop card + store", "A branded card that unlocks internal purchases."],["Standard US banking tools", "Loans, statements, analytics."]].map(([t, d]) => (
          <div key={t} className="glass rounded-2xl p-6"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
        ))}
      </div>
    </div>
  </MarketingShell>
) });