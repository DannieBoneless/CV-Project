import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { MessageCircle, Mail, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/support")({ component: Support });

function Support() {
  return (
    <DashboardShell title="Support">
      <div className="grid gap-4 md:grid-cols-2">
        <a href="https://wa.me/2347045510914?text=I%20need%20assistance" target="_blank" rel="noopener noreferrer" className="glass rounded-2xl p-6 transition hover:shadow-elegant">
          <MessageCircle className="h-6 w-6 text-emerald-500" />
          <h3 className="mt-3 font-semibold">Live chat (WhatsApp)</h3>
          <p className="text-sm text-muted-foreground">Real humans, average 2 min reply.</p>
        </a>
        <a href="mailto:support@crestvest.com" className="glass rounded-2xl p-6 transition hover:shadow-elegant">
          <Mail className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-semibold">Email support</h3>
          <p className="text-sm text-muted-foreground">support@crestvest.com</p>
        </a>
        <a href="https://wa.me/2347045510914?text=I%20want%20to%20report%20fraud" target="_blank" rel="noopener noreferrer" className="glass rounded-2xl p-6 transition hover:shadow-elegant">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          <h3 className="mt-3 font-semibold">Report fraud</h3>
          <p className="text-sm text-muted-foreground">Notify us instantly if something looks off.</p>
        </a>
      </div>
    </DashboardShell>
  );
}