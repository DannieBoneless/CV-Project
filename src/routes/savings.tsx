import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp, type Goal, type GoalMode, type GoalStatus } from "@/context/app-context";
import { fmt, shortDate } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Pause, Play, Trash2, Pencil, X, PiggyBank } from "lucide-react";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Savings Goals — CrestVest Inc." },
      { name: "description", content: "Create unlimited savings goals with one-time, manual, or automatic daily/weekly/monthly deposits." },
      { property: "og:title", content: "Savings — CrestVest" },
      { property: "og:description", content: "Save toward the things that matter with automatic and manual goals." },
    ],
  }),
  component: Savings,
});

const MODES: { value: GoalMode; label: string; hint: string }[] = [
  { value: "one-time", label: "One-time deposit", hint: "Deposit the full target immediately." },
  { value: "manual", label: "Manual", hint: "You decide when and how much to save." },
  { value: "daily", label: "Automatic daily", hint: "Save a fixed amount every day." },
  { value: "weekly", label: "Automatic weekly", hint: "Save a fixed amount every week." },
  { value: "monthly", label: "Automatic monthly", hint: "Save a fixed amount every month." },
];

function Savings() {
  const { user, goals, createGoal, fundGoal, withdrawGoal, pauseGoal, resumeGoal, deleteGoal, editGoal } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [action, setAction] = useState<null | { goal: Goal; kind: "fund" | "withdraw" | "edit" | "history" }>(null);

  if (!user) return null;
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);

  return (
    <DashboardShell title="Savings">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl gradient-emerald p-6 text-white shadow-elegant">
          <div className="min-w-0">
            <div className="text-xs opacity-80">Total in savings goals</div>
            <div className="text-3xl font-bold">{fmt(totalSaved)}</div>
            <div className="mt-1 text-xs opacity-80">Main balance available: {fmt(user.balances.main)}</div>
          </div>
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-sm hover:bg-white/30">
            <Plus className="h-4 w-4" /> New goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <PiggyBank className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No savings goals yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create your first goal to start saving.</p>
            <button onClick={() => setShowNew(true)} className="mt-4 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">Create a goal</button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {goals.map((g) => <GoalCard key={g.id} g={g} onAction={(kind) => setAction({ goal: g, kind })} onPause={() => pauseGoal(g.id)} onResume={() => resumeGoal(g.id)} onDelete={() => { if (confirm(`Delete "${g.name}"? Remaining savings return to Main.`)) deleteGoal(g.id); }} />)}
          </div>
        )}
      </div>

      {showNew && <NewGoalModal onClose={() => setShowNew(false)} onCreate={async (v) => { try { await createGoal(v); toast.success("Goal created"); setShowNew(false); } catch (e) { toast.error((e as Error).message); } }} main={user.balances.main} />}
      {action?.kind === "fund" && <AmountModal title={`Fund "${action.goal.name}"`} available={user.balances.main} onClose={() => setAction(null)} onSubmit={async (amt) => { try { await fundGoal(action.goal.id, amt); toast.success("Funded"); setAction(null); } catch (e) { toast.error((e as Error).message); } }} />}
      {action?.kind === "withdraw" && <AmountModal title={`Withdraw from "${action.goal.name}"`} available={action.goal.saved} onClose={() => setAction(null)} onSubmit={async (amt) => { try { await withdrawGoal(action.goal.id, amt); toast.success("Withdrew"); setAction(null); } catch (e) { toast.error((e as Error).message); } }} />}
      {action?.kind === "edit" && <EditModal goal={action.goal} onClose={() => setAction(null)} onSubmit={async (patch) => { await editGoal(action.goal.id, patch); toast.success("Updated"); setAction(null); }} />}
      {action?.kind === "history" && <HistoryModal goal={action.goal} onClose={() => setAction(null)} />}
    </DashboardShell>
  );
}

function GoalCard({ g, onAction, onPause, onResume, onDelete }: { g: Goal; onAction: (k: "fund" | "withdraw" | "edit" | "history") => void; onPause: () => void; onResume: () => void; onDelete: () => void }) {
  const pct = Math.min(100, (g.saved / g.target) * 100);
  const remaining = Math.max(0, g.target - g.saved);
  const daysLeft = g.dueDate ? Math.max(0, Math.ceil((new Date(g.dueDate).getTime() - Date.now()) / 86400000)) : null;
  const statusColor: Record<GoalStatus, string> = {
    active: "bg-emerald-500/20 text-emerald-600",
    paused: "bg-amber-500/20 text-amber-600",
    completed: "bg-primary/20 text-primary",
    cancelled: "bg-muted text-muted-foreground",
  };
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold">{g.name}</div>
          <div className="text-xs text-muted-foreground">{modeLabel(g.mode)}{g.autoAmount ? ` · ${fmt(g.autoAmount)}` : ""}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[g.status]}`}>{g.status}</span>
      </div>
      {g.description && <p className="mt-1 text-xs text-muted-foreground">{g.description}</p>}
      <div className="mt-3 flex justify-between text-xs"><span>{fmt(g.saved)}</span><span className="text-muted-foreground">{fmt(g.target)}</span></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full gradient-emerald" style={{ width: `${pct}%` }} /></div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
        <div><div>Complete</div><div className="font-semibold text-foreground">{pct.toFixed(0)}%</div></div>
        <div><div>Remaining</div><div className="font-semibold text-foreground">{fmt(remaining)}</div></div>
        <div><div>Days left</div><div className="font-semibold text-foreground">{daysLeft ?? "—"}</div></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => onAction("fund")} disabled={g.status === "completed" || g.status === "cancelled"} className="rounded-md gradient-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50">Fund</button>
        <button onClick={() => onAction("withdraw")} disabled={g.saved === 0} className="rounded-md border px-3 py-1 text-xs disabled:opacity-50">Withdraw</button>
        {g.status === "active" && <button onClick={onPause} className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs"><Pause className="h-3 w-3" /> Pause</button>}
        {g.status === "paused" && <button onClick={onResume} className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs"><Play className="h-3 w-3" /> Resume</button>}
        <button onClick={() => onAction("edit")} className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs"><Pencil className="h-3 w-3" /> Edit</button>
        <button onClick={() => onAction("history")} className="rounded-md border px-3 py-1 text-xs">History</button>
        <button onClick={onDelete} className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-3 py-1 text-xs text-destructive"><Trash2 className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

function modeLabel(m: GoalMode) { return MODES.find((x) => x.value === m)?.label ?? m; }

function NewGoalModal({ onClose, onCreate, main }: { onClose: () => void; onCreate: (v: any) => void; main: number }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<GoalMode>("manual");
  const [autoAmount, setAutoAmount] = useState("");
  const [initial, setInitial] = useState("");
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold">New savings goal</h3>
      <div className="mt-3 space-y-3">
        <Field label="Goal name"><input value={name} onChange={(e) => setName(e.target.value)} className="input" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Target ($)"><input type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} className="input" /></Field>
          <Field label="Target date"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" /></Field>
        </div>
        <Field label="Description (optional)"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-16" /></Field>
        <Field label="Savings mode">
          <select value={mode} onChange={(e) => setMode(e.target.value as GoalMode)} className="input">
            {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">{MODES.find((m) => m.value === mode)?.hint}</p>
        </Field>
        {(mode === "daily" || mode === "weekly" || mode === "monthly") && (
          <Field label="Auto amount ($)"><input type="number" min="1" value={autoAmount} onChange={(e) => setAutoAmount(e.target.value)} className="input" /></Field>
        )}
        {mode !== "one-time" && (
          <Field label="Initial deposit ($, optional)"><input type="number" min="0" value={initial} onChange={(e) => setInitial(e.target.value)} className="input" /></Field>
        )}
        <div className="text-xs text-muted-foreground">Main balance: {fmt(main)}</div>
        <button
          onClick={() => onCreate({ name, target: Number(target), dueDate: dueDate || undefined, description: description || undefined, mode, autoAmount: autoAmount ? Number(autoAmount) : undefined, initialDeposit: initial ? Number(initial) : undefined })}
          className="w-full rounded-lg gradient-primary py-3 font-medium text-primary-foreground"
        >
          Create goal
        </button>
      </div>
    </Modal>
  );
}

function EditModal({ goal, onClose, onSubmit }: { goal: Goal; onClose: () => void; onSubmit: (p: Partial<Goal>) => void }) {
  const [name, setName] = useState(goal.name);
  const [target, setTarget] = useState(String(goal.target));
  const [dueDate, setDueDate] = useState(goal.dueDate?.slice(0, 10) ?? "");
  const [description, setDescription] = useState(goal.description ?? "");
  const [autoAmount, setAutoAmount] = useState(goal.autoAmount ? String(goal.autoAmount) : "");
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold">Edit goal</h3>
      <div className="mt-3 space-y-3">
        <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className="input" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Target"><input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="input" /></Field>
          <Field label="Date"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" /></Field>
        </div>
        <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-16" /></Field>
        {goal.mode !== "one-time" && goal.mode !== "manual" && (
          <Field label="Auto amount"><input type="number" value={autoAmount} onChange={(e) => setAutoAmount(e.target.value)} className="input" /></Field>
        )}
        <button onClick={() => onSubmit({ name, target: Number(target), dueDate: dueDate || undefined, description: description || undefined, autoAmount: autoAmount ? Number(autoAmount) : undefined })} className="w-full rounded-lg gradient-primary py-3 font-medium text-primary-foreground">Save</button>
      </div>
    </Modal>
  );
}

function AmountModal({ title, available, onClose, onSubmit }: { title: string; available: number; onClose: () => void; onSubmit: (amt: number) => void }) {
  const [amt, setAmt] = useState("");
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">Available: {fmt(available)}</p>
      <input type="number" min="1" value={amt} onChange={(e) => setAmt(e.target.value)} className="input mt-3" placeholder="Amount" />
      <button onClick={() => onSubmit(Number(amt))} className="mt-4 w-full rounded-lg gradient-primary py-3 font-medium text-primary-foreground">Confirm</button>
    </Modal>
  );
}

function HistoryModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold">{goal.name} — history</h3>
      {goal.history.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ul className="mt-3 max-h-80 divide-y overflow-y-auto text-sm">
          {goal.history.map((h) => (
            <li key={h.id} className="flex justify-between py-2">
              <div>
                <div className="font-medium capitalize">{h.type.replace("-", " ")}</div>
                <div className="text-xs text-muted-foreground">{shortDate(h.at)}</div>
              </div>
              <div className={h.type === "auto-failed" ? "text-destructive" : ""}>{fmt(h.amount)}</div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs text-muted-foreground">{label}</span>{children}</label>;
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-elegant animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        {children}
      </div>
    </div>
  );
}