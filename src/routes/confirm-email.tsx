import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { MailCheck } from "lucide-react";

export const Route = createFileRoute("/confirm-email")({ component: ConfirmEmail });

function ConfirmEmail() {
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => nav({ to: "/dashboard" }), 2500);
    return () => clearTimeout(t);
  }, [nav]);
  return (
    <MarketingShell>
      <div className="mx-auto max-w-md px-4 py-24 text-center animate-fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-primary-foreground">
          <MailCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Confirm your email</h1>
        <p className="mt-2 text-muted-foreground">We sent you a verification link. Taking you to your dashboard…</p>
      </div>
    </MarketingShell>
  );
}