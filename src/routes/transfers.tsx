import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
export const Route = createFileRoute("/transfers")({ component: () => (
  <MarketingShell><div className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-4xl font-bold">Send money in seconds</h1><p className="mt-3 text-muted-foreground">Zero-fee transfers between CrestVest users, and secure external bank transfers.</p></div></MarketingShell>
) });