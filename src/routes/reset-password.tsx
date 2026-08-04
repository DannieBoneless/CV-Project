import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the user into a temporary "recovery" session when they
    // arrive here via the emailed link — this just confirms it's present.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error("This reset link is invalid or has expired.");
        nav({ to: "/auth" });
      } else {
        setReady(true);
      }
    });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (pw !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Password updated — please sign in.");
      await supabase.auth.signOut();
      nav({ to: "/auth" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <MarketingShell>
      <div className="mx-auto max-w-md px-4 py-12">
        <form onSubmit={submit} className="glass rounded-2xl p-6 space-y-4 animate-fade-up">
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">New password</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-primary transition focus:border-primary focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Confirm password</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-primary transition focus:border-primary focus:ring-2"
            />
          </label>
          <button disabled={busy} className="w-full rounded-xl gradient-primary py-3 font-medium text-primary-foreground disabled:opacity-60">
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </MarketingShell>
  );
}