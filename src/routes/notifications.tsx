import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { shortDate } from "@/lib/format";
import { useEffect } from "react";

export const Route = createFileRoute("/notifications")({ component: N });

function N() {
  const { notifs, markAllNotifsRead } = useApp();
  useEffect(() => { markAllNotifsRead(); /* eslint-disable-next-line */ }, []);
  return (
    <DashboardShell title="Notifications">
      <div className="glass rounded-2xl">
        {notifs.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">You're all caught up.</div>
        ) : (
          <ul className="divide-y">
            {notifs.map((n) => (
              <li key={n.id} className="px-5 py-4">
                <div className="font-medium">{n.title}</div>
                <div className="text-sm text-muted-foreground">{n.message}</div>
                <div className="mt-1 text-xs text-muted-foreground">{shortDate(n.at)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}