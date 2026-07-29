import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { fmt } from "@/lib/format";
import { Snowflake, Settings2, CheckCircle2, Lock, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/cards")({ component: Cards });

type Tier = "Bronze" | "Silver" | "Gold" | "Platinum";
type CardApp = {
  status: "applied" | "issued";
  appliedAt: number;
  last4: string;
  cvv: string;
  expMonth: number;
  expYear: number;
  cardType: "virtual" | "physical";
};

const TIERS: { name: Tier; min: number; gradient: string; perks: string; ring: string }[] = [
  { name: "Bronze", min: 0, gradient: "linear-gradient(135deg, oklch(0.45 0.08 45), oklch(0.35 0.06 40))", perks: "Standard rewards · 1% cashback", ring: "ring-amber-700/40" },
  { name: "Silver", min: 2500, gradient: "linear-gradient(135deg, oklch(0.78 0.02 250), oklch(0.55 0.02 250))", perks: "2% cashback · Free ATM · Priority support", ring: "ring-slate-400/40" },
  { name: "Gold", min: 10000, gradient: "linear-gradient(135deg, oklch(0.82 0.14 90), oklch(0.55 0.13 65))", perks: "3% cashback · Airport lounge · Concierge", ring: "ring-yellow-500/50" },
  { name: "Platinum", min: 50000, gradient: "linear-gradient(135deg, oklch(0.9 0.02 260), oklch(0.55 0.05 280), oklch(0.72 0.16 200))", perks: "5% cashback · Global insurance · Private banking", ring: "ring-fuchsia-400/50" },
];

function tierFor(total: number): Tier {
  return [...TIERS].reverse().find((t) => total >= t.min)!.name;
}

function useCardApp(userId: string | undefined) {
  const key = userId ? `crestvest:card:${userId}` : null;
  const [app, setApp] = useState<CardApp | null>(() => {
    if (!key || typeof window === "undefined") return null;
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  useEffect(() => {
    if (!key) return;
    if (app) localStorage.setItem(key, JSON.stringify(app));
    else localStorage.removeItem(key);
  }, [key, app]);
  return [app, setApp] as const;
}

function Cards() {
  const { user, txs } = useApp();
  const [app, setApp] = useCardApp(user?.email);
  if (!user) return null;

  const totalVolume = useMemo(
    () => txs.filter((t) => t.status !== "failed").reduce((s, t) => s + Math.abs(t.amount), 0),
    [txs],
  );
  const tier = tierFor(totalVolume);

  if (!app) return <DashboardShell title="Cards"><CardApplyForm onIssue={setApp} /></DashboardShell>;
  if (app.status === "applied")
    return <DashboardShell title="Cards"><CardProcessing app={app} onComplete={() => setApp({ ...app, status: "issued" })} /></DashboardShell>;

  return (
    <DashboardShell title="Cards">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-500">
            <CheckCircle2 className="h-3.5 w-3.5" /> Card issued
          </div>
          <h2 className="mt-3 text-2xl font-bold">Your CrestVest {tier} card is ready</h2>
        </div>
        <TiltCard user={user} app={app} tier={tier} />
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm hover:bg-muted"><Snowflake className="h-4 w-4" /> Freeze card</button>
          <button className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm hover:bg-muted"><Settings2 className="h-4 w-4" /> Limits</button>
        </div>
        <TierLadder currentTier={tier} totalVolume={totalVolume} />
        <div className="glass rounded-2xl p-5 text-sm">
          <div className="font-semibold">Where can I use my CrestVest card?</div>
          <p className="mt-1 text-muted-foreground">
            Your card works inside the CrestVest ecosystem — for the internal{" "}
            <Link to="/store" className="text-primary underline-offset-4 hover:underline">Store</Link>, plan upgrades, and select global merchants. Balance is topped up from your main account.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ---------------- Application form ---------------- */

function CardApplyForm({ onIssue }: { onIssue: (a: CardApp) => void }) {
  const { user } = useApp();
  const [form, setForm] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    dob: "",
    address: "",
    city: "",
    country: "United States",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    cardType: "virtual" as "virtual" | "physical",
    agree: false,
  });
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.fullName.trim() || !form.dob || !form.address || !form.city || !form.bankName || form.accountNumber.length < 6 || form.routingNumber.length < 6) {
      setErr("Please complete every field with valid information.");
      return;
    }
    if (!form.agree) { setErr("You must accept the cardholder agreement."); return; }
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    const cvv = String(Math.floor(100 + Math.random() * 900));
    const now = new Date();
    onIssue({
      status: "applied",
      appliedAt: Date.now(),
      last4,
      cvv,
      expMonth: (now.getMonth() % 12) + 1,
      expYear: (now.getFullYear() + 4) % 100,
      cardType: form.cardType,
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Apply for your CrestVest card</h2>
        <p className="mt-1 text-sm text-muted-foreground">One card for spending, saving, and rewards. Approval takes about a minute.</p>
      </header>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full legal name"><input className="input" value={form.fullName} onChange={set("fullName")} placeholder="Jane Doe" /></Field>
          <Field label="Date of birth"><input type="date" className="input" value={form.dob} onChange={set("dob")} /></Field>
          <Field label="Residential address" wide><input className="input" value={form.address} onChange={set("address")} placeholder="123 Main St" /></Field>
          <Field label="City"><input className="input" value={form.city} onChange={set("city")} /></Field>
          <Field label="Country">
            <select className="input" value={form.country} onChange={set("country")}>
              {["United States","Canada","United Kingdom","Germany","France","Nigeria","South Africa","India","Japan","Australia"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Funding bank details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank name" wide><input className="input" value={form.bankName} onChange={set("bankName")} placeholder="Chase, Wells Fargo, ..." /></Field>
          <Field label="Account number"><input className="input" inputMode="numeric" value={form.accountNumber} onChange={set("accountNumber")} placeholder="••••••" /></Field>
          <Field label="Routing / SWIFT"><input className="input" value={form.routingNumber} onChange={set("routingNumber")} /></Field>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Card format</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["virtual","physical"] as const).map((t) => (
            <label key={t} className={`cursor-pointer rounded-xl border p-4 text-sm transition ${form.cardType === t ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
              <input type="radio" name="cardType" value={t} checked={form.cardType === t} onChange={() => setForm((f) => ({ ...f, cardType: t }))} className="sr-only" />
              <div className="font-semibold capitalize">{t} card</div>
              <div className="text-xs text-muted-foreground">{t === "virtual" ? "Instant issue · Apple / Google Pay ready" : "Ships in 5-7 business days · metal composite"}</div>
            </label>
          ))}
        </div>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={form.agree} onChange={set("agree")} className="mt-0.5" />
          I confirm the information above is accurate and I accept the CrestVest Cardholder Agreement and Privacy Notice.
        </label>
      </section>

      {err && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}
      <button type="submit" className="w-full rounded-xl gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-elegant transition hover:scale-[1.01]">Submit application</button>
    </form>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/* ---------------- Processing (60s) ---------------- */

function CardProcessing({ app, onComplete }: { app: CardApp; onComplete: () => void }) {
  const DURATION = 60_000;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.min(DURATION, now - app.appliedAt);
  const pct = Math.min(100, (elapsed / DURATION) * 100);
  const remaining = Math.max(0, Math.ceil((DURATION - elapsed) / 1000));

  useEffect(() => {
    if (elapsed >= DURATION) onComplete();
  }, [elapsed, onComplete]);

  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="glass rounded-3xl p-8 text-center shadow-elegant">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-primary text-primary-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="mt-5 text-xl font-bold">Processing your card request</h2>
        <p className="mt-2 text-sm text-destructive font-medium">
          Please do not close or refresh this page.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          We're securely verifying your details, provisioning card credentials, and running compliance checks.
        </p>
        <div className="mt-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full gradient-primary transition-all duration-200" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(pct)}%</span>
            <span className="font-mono">{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")} remaining</span>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Encrypted end-to-end
        </div>
      </div>
    </div>
  );
}

/* ---------------- 3D tilt card ---------------- */

function TiltCard({ user, app, tier }: { user: { firstName: string; lastName: string }; app: CardApp; tier: Tier }) {
  const meta = TIERS.find((t) => t.name === tier)!;
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setTilt({ ry: (x - 0.5) * 22, rx: -(y - 0.5) * 22, mx: x * 100, my: y * 100 });
  };
  const reset = () => setTilt({ rx: 0, ry: 0, mx: 50, my: 50 });

  return (
    <div className="[perspective:1200px]">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className={`relative mx-auto aspect-[1.586/1] w-full max-w-md rounded-2xl p-6 text-white shadow-elegant transition-transform duration-150 ease-out ring-2 ${meta.ring}`}
        style={{
          background: meta.gradient,
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* holographic sheen */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-overlay"
          style={{
            background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%)`,
          }}
        />
        {tier === "Platinum" && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-40 mix-blend-color-dodge"
            style={{ background: `linear-gradient(${tilt.mx * 3.6}deg, #ff00c8, #00e5ff, #ffe600, #ff00c8)` }}
          />
        )}
        <div className="relative flex justify-between text-xs uppercase tracking-[0.25em] opacity-90">
          <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> CrestVest {tier}</span>
          <span>VISA</span>
        </div>
        <div className="relative mt-10 font-mono text-xl tracking-widest drop-shadow">
          •••• •••• •••• {app.last4}
        </div>
        <div className="relative mt-6 flex items-end justify-between text-[11px]">
          <div>
            <div className="opacity-70">Cardholder</div>
            <div className="font-semibold uppercase">{user.firstName} {user.lastName}</div>
          </div>
          <div>
            <div className="opacity-70">Exp</div>
            <div>{String(app.expMonth).padStart(2, "0")}/{String(app.expYear).padStart(2, "0")}</div>
          </div>
          <div>
            <div className="opacity-70">CVV</div>
            <div>{app.cvv}</div>
          </div>
        </div>
        <div className="relative mt-3 text-[10px] uppercase tracking-widest opacity-70">{app.cardType} card</div>
      </div>
    </div>
  );
}

/* ---------------- Tier ladder ---------------- */

function TierLadder({ currentTier, totalVolume }: { currentTier: Tier; totalVolume: number }) {
  const idx = TIERS.findIndex((t) => t.name === currentTier);
  const next = TIERS[idx + 1];
  const toNext = next ? Math.max(0, next.min - totalVolume) : 0;
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Tier progression</h3>
        <span className="text-xs text-muted-foreground">Total volume: {fmt(totalVolume)}</span>
      </div>
      {next ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Reach {fmt(next.min)} in total transactions to unlock the {next.name} tier — {fmt(toNext)} to go.
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">You've reached the highest tier. Enjoy every perk.</p>
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {TIERS.map((t) => {
          const active = t.name === currentTier;
          const unlocked = totalVolume >= t.min;
          return (
            <div key={t.name} className={`rounded-xl border p-3 text-xs transition ${active ? "border-primary bg-primary/5" : "border-border"} ${!unlocked ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between font-semibold">
                <span>{t.name}</span>
                {unlocked ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Lock className="h-3.5 w-3.5" />}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{fmt(t.min)}+</div>
              <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t.perks}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}