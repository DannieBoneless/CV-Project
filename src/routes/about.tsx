import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import community from "@/assets/community.jpg";
export const Route = createFileRoute("/about")({ component: () => (
  <MarketingShell>
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 animate-fade-up">
      <div>
        <h1 className="text-4xl font-bold">About CrestVest Inc.</h1>
        <p className="mt-4 text-muted-foreground">We're building the everyday bank for people who take money seriously — with investing baked in from day one.</p>
        <p className="mt-3 text-muted-foreground">Founded in 2023, CrestVest serves 2.4M+ customers across 190+ countries.</p>
      </div>
      <img src={community} alt="Team" width={1024} height={1024} loading="lazy" className="w-full rounded-2xl shadow-elegant" />
    </div>
  </MarketingShell>
) });