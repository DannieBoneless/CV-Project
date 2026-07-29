import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export const Route = createFileRoute("/analytics")({ component: Analytics });

const bars = [
  { m: "Jan", in: 3200, out: 2400 }, { m: "Feb", in: 3600, out: 2800 },
  { m: "Mar", in: 4100, out: 2600 }, { m: "Apr", in: 3900, out: 3100 },
  { m: "May", in: 4500, out: 2900 }, { m: "Jun", in: 5200, out: 3400 },
];

function Analytics() {
  return (
    <DashboardShell title="Analytics">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Income vs Expenses</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={bars}><XAxis dataKey="m" /><YAxis /><Tooltip /><Bar dataKey="in" fill="oklch(0.72 0.17 155)" radius={4} /><Bar dataKey="out" fill="oklch(0.55 0.2 260)" radius={4} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Cash flow</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={bars}><XAxis dataKey="m" /><YAxis /><Tooltip /><Line type="monotone" dataKey="in" stroke="oklch(0.55 0.2 260)" strokeWidth={2} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}