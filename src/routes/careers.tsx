import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
const JOBS = [["Senior Frontend Engineer", "Remote"], ["Product Designer", "New York"], ["Compliance Officer", "Miami"], ["Data Scientist", "Remote"]];
export const Route = createFileRoute("/careers")({ component: () => (
  <MarketingShell><div className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-4xl font-bold">Careers at CrestVest</h1><ul className="mt-6 divide-y rounded-xl border">{JOBS.map(([t, l]) => (<li key={t} className="flex justify-between p-4"><span className="font-medium">{t}</span><span className="text-sm text-muted-foreground">{l}</span></li>))}</ul></div></MarketingShell>
) });