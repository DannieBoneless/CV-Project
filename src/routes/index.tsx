import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import community from "@/assets/community.jpg";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import {
  ShieldCheck, TrendingUp, Zap, Globe2, CreditCard, PiggyBank,
  ArrowRight, Star, ChevronDown,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40" aria-hidden>
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-float" />
          <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-accent/30 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        </div>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs">
              <Star className="h-3 w-3 text-accent" /> New: 12% APY Legend Vault
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Bank smarter.<br />
              <span className="bg-clip-text text-transparent gradient-primary">Grow wealth faster.</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              CrestVest is a premium digital bank and investment platform. One account for spending, saving, and building long-term wealth.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-elegant transition hover:scale-[1.02]">
                Open your account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/features" className="rounded-xl border border-border px-6 py-3 font-medium hover:bg-muted">
                Explore features
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <span>FDIC insured to $250k</span>
              <span>· Zero monthly fees</span>
              <span>· 190+ countries</span>
            </div>
          </div>
          <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <FloatingCards />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {[
            ["2.4M+", "Active accounts"],
            ["$8.6B", "Assets under management"],
            ["12%", "Top vault APY"],
            ["4.9★", "App Store rating"],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-bold md:text-3xl">{n}</div>
              <div className="text-xs text-muted-foreground md:text-sm">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything a bank should be</h2>
        <p className="mt-2 text-muted-foreground">Modern tools for the way you actually manage money.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { i: ShieldCheck, t: "Bank-grade security", d: "256-bit encryption, biometric login, and FDIC insurance up to $250,000." },
            { i: TrendingUp, t: "Grow your wealth", d: "Locked vaults from 5% to 12% APY with transparent terms." },
            { i: Zap, t: "Instant transfers", d: "Move money between accounts and users in seconds — no fees." },
            { i: Globe2, t: "Global by default", d: "Send to 190+ countries with real mid-market exchange rates." },
            { i: CreditCard, t: "Virtual & physical cards", d: "Freeze, unfreeze, set limits — total control from the app." },
            { i: PiggyBank, t: "Smart savings", d: "Goal-based savings that automate the work for you." },
          ].map((f) => (
            <div key={f.t} className="glass rounded-2xl p-6 transition hover:scale-[1.02] hover:shadow-elegant">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                <f.i className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 rounded-3xl border bg-muted/30 p-6 md:grid-cols-2 md:p-12">
          <img src={community} alt="Happy CrestVest customers" width={1024} height={1024} loading="lazy" className="h-full w-full rounded-2xl object-cover shadow-elegant" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Join 2.4M+ people building better financial lives</h2>
            <p className="mt-3 text-muted-foreground">
              From first-time savers to seasoned investors, our community trusts CrestVest to keep their money moving and growing.
            </p>
            <Link to="/auth" className="mt-6 inline-flex rounded-xl gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-elegant">
              Join CrestVest
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold tracking-tight">Loved by customers</h2>
        <p className="mt-2 text-muted-foreground">Real stories from CrestVest members around the world.</p>
        <div className="mt-8">
          <TestimonialsCarousel />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-3xl font-bold tracking-tight">Frequently asked</h2>
        <div className="mt-6 space-y-3">
          {[
            ["Is my money safe?", "Yes. Deposits are FDIC insured up to $250,000. We use bank-grade encryption end-to-end."],
            ["Are there any hidden fees?", "No monthly fees, no transfer fees between CrestVest users, no minimum balance."],
            ["How fast are transfers?", "Internal transfers are instant. External bank transfers typically settle in 1–2 business days."],
            ["How do vaults work?", "Deposit into a Starter, Growth, or Legend Vault. Funds are locked for the vault term and earn stated APY at maturity."],
          ].map(([q, a]) => <FAQ key={q} q={q} a={a} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="rounded-3xl gradient-primary p-10 text-center text-primary-foreground shadow-elegant md:p-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Your better bank is one tap away</h2>
          <p className="mt-3 opacity-90">Open your CrestVest account in under 2 minutes.</p>
          <Link to="/auth" className="mt-6 inline-flex rounded-xl bg-background px-6 py-3 font-medium text-foreground">Get started free</Link>
        </div>
      </section>
    </MarketingShell>
  );
}

function FloatingCards() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-md">
      <div className="absolute left-4 top-6 h-56 w-80 rotate-[-6deg] rounded-2xl gradient-card p-5 text-white shadow-elegant animate-float">
        <div className="text-xs opacity-70">CrestVest Card</div>
        <div className="mt-8 text-xl tracking-widest">•••• 4242</div>
        <div className="mt-6 flex justify-between text-xs">
          <span>ALEX MORGAN</span><span>12/29</span>
        </div>
      </div>
      <div className="absolute right-0 top-32 h-40 w-64 rotate-[8deg] rounded-2xl glass p-4 shadow-elegant animate-float" style={{ animationDelay: "1s" }}>
        <div className="text-xs text-muted-foreground">Main balance</div>
        <div className="mt-2 text-2xl font-bold">$12,480.55</div>
        <div className="mt-1 text-xs text-emerald-500">+$240 this week</div>
      </div>
      <div className="absolute bottom-0 left-8 h-32 w-56 rotate-[-3deg] rounded-2xl glass p-4 shadow-elegant animate-float" style={{ animationDelay: "0.5s" }}>
        <div className="text-xs text-muted-foreground">Growth Vault</div>
        <div className="mt-2 text-lg font-bold">$5,000 locked</div>
        <div className="mt-1 text-xs">8% APY · 47d left</div>
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="font-medium">{q}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-4 text-sm text-muted-foreground">{a}</p>}
    </div>
  );
}
