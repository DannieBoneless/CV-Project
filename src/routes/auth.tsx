import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/components/marketing-shell";
import { useApp } from "@/context/app-context";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  return (
    <MarketingShell>
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="mb-4 grid grid-cols-2 rounded-xl border border-border p-1">
          <button onClick={() => setMode("login")} className={`rounded-lg py-2 text-sm font-medium ${mode === "login" ? "gradient-primary text-primary-foreground" : ""}`}>Sign in</button>
          <button onClick={() => setMode("signup")} className={`rounded-lg py-2 text-sm font-medium ${mode === "signup" ? "gradient-primary text-primary-foreground" : ""}`}>Create account</button>
        </div>
        {mode === "login" ? <LoginForm /> : <SignupForm />}
      </div>
    </MarketingShell>
  );
}

function LoginForm() {
  const { login } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Real Supabase auth
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error && !error.message.toLowerCase().includes("invalid login credentials")) {
        throw error;
      }
      // Also hydrate local app state (falls back to demo user for the mock creds)
      try { await login(email, pw); } catch { /* ignore if only supabase side exists */ }
      toast.success("Welcome back!");
      nav({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setResetBusy(false);
    }
  };

  if (showForgot) {
    return (
      <div className="animate-fade-up">
        <form onSubmit={submitReset} className="glass rounded-2xl p-6 space-y-4">
          <button
            type="button"
            onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(""); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to sign in
          </button>
          <h1 className="text-2xl font-bold">Reset your password</h1>
          {resetSent ? (
            <p className="rounded-lg bg-primary/10 p-3 text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{resetEmail}</span>, a reset link has been sent. Check your inbox.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Enter your email and we'll send you a link to reset your password.</p>
              <Field label="Email" type="email" value={resetEmail} onChange={setResetEmail} autoComplete="email" required />
              <button disabled={resetBusy} className="w-full rounded-xl gradient-primary py-3 font-medium text-primary-foreground disabled:opacity-60">
                {resetBusy ? "Sending…" : "Send reset link"}
              </button>
            </>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* 
      <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
        <div className="font-semibold text-primary">Test credentials</div>
        <div className="mt-1 text-muted-foreground">Email: <span className="font-mono">user@invest.com</span></div>
        <div className="text-muted-foreground">Password: <span className="font-mono">password123</span></div>
      </div>
      */}
      <form onSubmit={submit} className="glass rounded-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <div>
          <Field label="Password" type="password" value={pw} onChange={setPw} autoComplete="current-password" required />
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="mt-1 text-xs text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <button disabled={busy} className="w-full rounded-xl gradient-primary py-3 font-medium text-primary-foreground disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our <Link to="/terms" className="text-primary underline-offset-4 hover:underline">Terms</Link>.
        </p>
      </form>
    </div>
  );
}

/** Stable module-scope Field prevents input re-mounting (focus loss). */
function Field({
  label, value, onChange, type = "text", required, autoComplete, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; autoComplete?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-primary transition focus:border-primary focus:ring-2"
      />
    </label>
  );
}

type Data = {
  firstName: string; lastName: string; email: string; phone: string; password: string; confirm: string;
  country: string; city: string; address: string; zip: string;
  idNumber: string; cardNumber: string; cardExp: string; cardCvc: string;
  pin: string; pinConfirm: string;
};

function SignupForm() {
  const { register } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>({
    firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "",
    country: "", city: "", address: "", zip: "",
    idNumber: "", cardNumber: "", cardExp: "", cardCvc: "",
    pin: "", pinConfirm: "",
  });
  const set = (k: keyof Data) => (v: string) => setData((d) => ({ ...d, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (data.password !== data.confirm) { toast.error("Passwords don't match"); return; }
    if (!/^\d{4}$|^\d{6}$/.test(data.pin)) { toast.error("PIN must be 4 or 6 digits"); return; }
    if (data.pin !== data.pinConfirm) { toast.error("PINs don't match"); return; }
    try {
      // 1) Real Supabase auth signup
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            full_name: `${data.firstName} ${data.lastName}`.trim(),
            phone: data.phone,
            address: data.address,
            city: data.city,
            country: data.country,
          },
        },
      });
      if (authErr && !authErr.message.toLowerCase().includes("already registered")) {
        throw authErr;
      }
      // 2) Hydrate local app state
      await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
      }).catch(() => {});
      // 3) Save payment PIN locally (frontend-only, no backend call)
      try { localStorage.setItem("crestvest.payment_pin", data.pin); } catch { /* ignore */ }
      nav({ to: "/confirm-email" });
    } catch (e) { toast.error((e as Error).message); }
  };

  const steps = ["Personal", "Address", "Identity", "Link card", "Payment PIN"];
  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex items-center justify-between text-xs">
        {steps.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 ${i <= step ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${i <= step ? "gradient-primary text-primary-foreground" : "bg-muted"}`}>{i + 1}</div>
            <span className="hidden sm:inline">{s}</span>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-6 space-y-4">
        {step === 0 && (
          <>
            <h2 className="text-xl font-bold">Personal information</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" value={data.firstName} onChange={set("firstName")} required />
              <Field label="Last name" value={data.lastName} onChange={set("lastName")} required />
            </div>
            <Field label="Email" type="email" value={data.email} onChange={set("email")} required autoComplete="email" />
            <Field label="Phone" value={data.phone} onChange={set("phone")} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Password" type="password" value={data.password} onChange={set("password")} required />
              <Field label="Confirm" type="password" value={data.confirm} onChange={set("confirm")} required />
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold">Address</h2>
            <Field label="Country" value={data.country} onChange={set("country")} />
            <Field label="City" value={data.city} onChange={set("city")} />
            <Field label="Street address" value={data.address} onChange={set("address")} />
            <Field label="ZIP / Postal code" value={data.zip} onChange={set("zip")} />
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl font-bold">Identity verification</h2>
            <p className="text-sm text-muted-foreground">Provide a government ID number and upload a quick selfie.</p>
            <Field label="Government ID number" value={data.idNumber} onChange={set("idNumber")} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Selfie</span>
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Tap to upload — <span className="text-primary">placeholder</span>
              </div>
            </label>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-xl font-bold">Link your debit card</h2>
            <p className="text-sm text-muted-foreground">Optional. You can add or link cards any time later.</p>
            <Field label="Card number" value={data.cardNumber} onChange={set("cardNumber")} placeholder="•••• •••• •••• ••••" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry" value={data.cardExp} onChange={set("cardExp")} placeholder="MM/YY" />
              <Field label="CVC" value={data.cardCvc} onChange={set("cardCvc")} placeholder="123" />
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Set your Payment PIN</h2>
                <p className="text-xs text-muted-foreground">You'll enter this to authorize every transfer.</p>
              </div>
            </div>
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              Use a 4 or 6 digit PIN. After 4 wrong tries payments are locked and you'll need to contact support.
            </p>
            <Field
              label="Payment PIN (4 or 6 digits)"
              type="password"
              value={data.pin}
              onChange={(v) => set("pin")(v.replace(/\D/g, "").slice(0, 6))}
              required
            />
            <Field
              label="Confirm PIN"
              type="password"
              value={data.pinConfirm}
              onChange={(v) => set("pinConfirm")(v.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </>
        )}
        <div className="flex justify-between pt-2">
          <button type="button" onClick={back} disabled={step === 0} className="rounded-lg px-4 py-2 text-sm disabled:opacity-40">Back</button>
          {step < 4 ? (
            <button type="button" onClick={next} className="rounded-lg gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground">Continue</button>
          ) : (
            <button type="button" onClick={finish} className="rounded-lg gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground">Create account</button>
          )}
        </div>
      </div>
    </div>
  );
}