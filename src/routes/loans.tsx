import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp, type DocRef, type Loan, type LoanStatus } from "@/context/app-context";
import { fmt, shortDate } from "@/lib/format";
import { toast } from "sonner";
import { X, Upload, FileText, Download } from "lucide-react";

export const Route = createFileRoute("/loans")({
  head: () => ({
    meta: [
      { title: "Personal Loans — CrestVest Inc." },
      { name: "description", content: "Apply for a personal loan with identity, income, address, and bank verification." },
      { property: "og:title", content: "Personal Loans — CrestVest" },
      { property: "og:description", content: "Apply, get reviewed, and receive funds directly to your Main account." },
    ],
  }),
  component: Loans,
});

const ID_TYPES = ["Passport", "Driver's License", "National ID", "State-issued ID", "Birth Certificate", "Citizenship Certificate", "Social Security Card", "Military ID"];
const INCOME_EMPLOYED = ["Pay slip", "W-2", "1099", "Tax return", "Bank statement", "Employer letter"];
const INCOME_SELF = ["Tax return (last 2 yrs)", "Bank statement", "1099", "Business financial statement"];
const ADDRESS_TYPES = ["Utility bill", "Lease agreement", "Mortgage statement", "Insurance document", "Property tax receipt", "Voter registration", "Bank statement", "Credit card statement"];

const STATUS_COLORS: Record<LoanStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/20 text-primary",
  "under-review": "bg-amber-500/20 text-amber-600",
  "additional-docs-required": "bg-amber-500/20 text-amber-700",
  approved: "bg-emerald-500/20 text-emerald-600",
  declined: "bg-destructive/20 text-destructive",
  disbursed: "bg-emerald-500/20 text-emerald-600",
  closed: "bg-muted text-muted-foreground",
};

function Loans() {
  const { user, loans, repayLoan, payoffLoan } = useApp();
  const [showApp, setShowApp] = useState(false);
  const [payFor, setPayFor] = useState<Loan | null>(null);
  const [payAmt, setPayAmt] = useState("");

  if (!user) return null;
  const active = loans.filter((l) => l.status === "disbursed");
  const other = loans.filter((l) => l.status !== "disbursed");

  const doPay = async () => {
    if (!payFor) return;
    try { await repayLoan(payFor.id, Number(payAmt)); toast.success("Payment made"); setPayFor(null); setPayAmt(""); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <DashboardShell title="Personal Loans">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Loan dashboard</h2>
            <p className="text-sm text-muted-foreground">Apply, track, and repay personal loans directly from your Main account.</p>
          </div>
          <button onClick={() => setShowApp(true)} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">Apply for a loan</button>
        </div>

        {active.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Active loans</h3>
            {active.map((l) => <LoanCard key={l.id} l={l} onPay={() => { setPayFor(l); setPayAmt(String(l.monthlyPayment)); }} onPayoff={() => { if (confirm(`Pay off ${fmt(l.remaining)}?`)) payoffLoan(l.id).then(() => toast.success("Loan paid off")).catch((e) => toast.error(e.message)); }} />)}
          </div>
        )}

        {other.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Applications & closed</h3>
            {other.map((l) => <LoanCard key={l.id} l={l} />)}
          </div>
        )}

        {loans.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">No loan applications yet.</div>
        )}
      </div>

      {showApp && <ApplyModal onClose={() => setShowApp(false)} />}
      {payFor && (
        <Modal onClose={() => setPayFor(null)}>
          <h3 className="text-lg font-bold">Make a payment</h3>
          <p className="mt-1 text-xs text-muted-foreground">Remaining: {fmt(payFor.remaining)} · Suggested: {fmt(payFor.monthlyPayment)}</p>
          <input type="number" min="1" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} className="input mt-3" />
          <div className="mt-1 text-xs text-muted-foreground">Main balance: {fmt(user.balances.main)}</div>
          <button onClick={doPay} className="mt-4 w-full rounded-lg gradient-primary py-3 font-medium text-primary-foreground">Pay from Main</button>
        </Modal>
      )}
    </DashboardShell>
  );
}

function LoanCard({ l, onPay, onPayoff }: { l: Loan; onPay?: () => void; onPayoff?: () => void }) {
  const paid = l.payments.reduce((s, p) => s + p.amount, 0);
  const [showHist, setShowHist] = useState(false);
  const downloadStatement = () => {
    const rows = [
      ["Ref", l.id.slice(0, 8)],
      ["Amount", String(l.amount)],
      ["APR", String(l.apr)],
      ["Term (months)", String(l.termMonths)],
      ["Status", l.status],
      ["Remaining", String(l.remaining)],
      ["", ""],
      ["Date", "Payment"],
      ...l.payments.map((p) => [p.at, String(p.amount)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `loan-${l.id.slice(0, 8)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-bold">{fmt(l.amount)} <span className="text-xs font-normal text-muted-foreground">· {l.purpose}</span></div>
          <div className="text-xs text-muted-foreground">Applied {shortDate(l.submittedAt)} · {l.termMonths} mo · {l.apr}% APR</div>
          {l.reason && <div className="mt-1 text-xs text-destructive">Reason: {l.reason}</div>}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[l.status]}`}>{l.status.replace("-", " ")}</span>
      </div>
      {l.status === "disbursed" && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <Cell label="Remaining" v={fmt(l.remaining)} />
            <Cell label="Monthly" v={fmt(l.monthlyPayment)} />
            <Cell label="Total paid" v={fmt(paid)} />
            <Cell label="Next payment" v={l.nextPaymentAt ? shortDate(l.nextPaymentAt) : "—"} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {onPay && <button onClick={onPay} className="rounded-md gradient-primary px-3 py-1 text-xs text-primary-foreground">Make payment</button>}
            {onPayoff && <button onClick={onPayoff} className="rounded-md border px-3 py-1 text-xs">Pay off early</button>}
            <button onClick={() => setShowHist((v) => !v)} className="rounded-md border px-3 py-1 text-xs">{showHist ? "Hide" : "Repayment"} history</button>
            <button onClick={downloadStatement} className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs"><Download className="h-3 w-3" /> Statement</button>
          </div>
          {showHist && (
            <ul className="mt-3 divide-y text-xs">
              {l.payments.length === 0 ? <li className="py-2 text-muted-foreground">No payments yet.</li> : l.payments.map((p, i) => (
                <li key={i} className="flex justify-between py-2"><span>{shortDate(p.at)}</span><span>{fmt(p.amount)}</span></li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Cell({ label, v }: { label: string; v: string }) {
  return <div><div className="text-muted-foreground">{label}</div><div className="font-semibold">{v}</div></div>;
}

function ApplyModal({ onClose }: { onClose: () => void }) {
  const { user, submitLoan } = useApp();
  const [step, setStep] = useState(1);
  const [personal, setPersonal] = useState({
    fullName: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
    dob: "", phone: user?.phone ?? "", email: user?.email ?? "",
    address: user?.address ?? "", prevAddress: "", governmentId: "", employment: "employed",
  });
  const [loanDetails, setLoanDetails] = useState({ amount: "", purpose: "", termMonths: "24", monthlyIncome: "", monthlyExpenses: "", existingDebts: "" });
  const [ids, setIds] = useState<DocRef[]>([]);
  const [income, setIncome] = useState<DocRef[]>([]);
  const [addressDocs, setAddressDocs] = useState<DocRef[]>([]);
  const [prevAddrDocs, setPrevAddrDocs] = useState<DocRef[]>([]);
  const [bank, setBank] = useState({ name: "", holder: "", routing: "", account: "" });
  const [submitting, setSubmitting] = useState(false);

  const upload = (setter: (v: DocRef[]) => void, current: DocRef[], defaultKind: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const kind = (e.target.dataset.kind as string) || defaultKind;
    const oversize = files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversize) toast.warning(`${oversize.name} skipped — over 5 MB`);
    const ok = files.filter((f) => f.size <= 5 * 1024 * 1024);
    setter([...current, ...ok.map((f) => ({ name: f.name, size: f.size, type: f.type, kind }))]);
    e.target.value = "";
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await submitLoan({
        amount: Number(loanDetails.amount),
        purpose: loanDetails.purpose,
        termMonths: Number(loanDetails.termMonths),
        personal,
        finances: {
          monthlyIncome: Number(loanDetails.monthlyIncome),
          monthlyExpenses: Number(loanDetails.monthlyExpenses),
          existingDebts: Number(loanDetails.existingDebts),
          employment: personal.employment,
        },
        docs: { ids, income, address: addressDocs, prevAddress: prevAddrDocs },
        bank,
      });
      toast.success("Application submitted");
      onClose();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSubmitting(false); }
  };

  const totalSteps = 7;
  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Loan application</h3>
        <span className="text-xs text-muted-foreground">Step {step} of {totalSteps}</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full gradient-primary" style={{ width: `${(step / totalSteps) * 100}%` }} /></div>

      <div className="mt-4 space-y-3">
        {step === 1 && (
          <>
            <Field label="Full name"><input value={personal.fullName} onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })} className="input" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Date of birth"><input type="date" value={personal.dob} onChange={(e) => setPersonal({ ...personal, dob: e.target.value })} className="input" /></Field>
              <Field label="Phone"><input value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} className="input" /></Field>
            </div>
            <Field label="Email"><input type="email" value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} className="input" /></Field>
            <Field label="Residential address"><input value={personal.address} onChange={(e) => setPersonal({ ...personal, address: e.target.value })} className="input" /></Field>
            <Field label="Previous address (if within 2 yrs)"><input value={personal.prevAddress} onChange={(e) => setPersonal({ ...personal, prevAddress: e.target.value })} className="input" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Gov ID / SSN"><input value={personal.governmentId} onChange={(e) => setPersonal({ ...personal, governmentId: e.target.value })} className="input" /></Field>
              <Field label="Employment">
                <select value={personal.employment} onChange={(e) => setPersonal({ ...personal, employment: e.target.value })} className="input">
                  <option value="employed">Employed</option>
                  <option value="self-employed">Self-employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="retired">Retired</option>
                </select>
              </Field>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Amount ($)"><input type="number" min="500" value={loanDetails.amount} onChange={(e) => setLoanDetails({ ...loanDetails, amount: e.target.value })} className="input" /></Field>
              <Field label="Term (months)">
                <select value={loanDetails.termMonths} onChange={(e) => setLoanDetails({ ...loanDetails, termMonths: e.target.value })} className="input">
                  {[6, 12, 24, 36, 60].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Purpose"><input value={loanDetails.purpose} onChange={(e) => setLoanDetails({ ...loanDetails, purpose: e.target.value })} className="input" placeholder="e.g. Home improvement" /></Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Monthly income"><input type="number" value={loanDetails.monthlyIncome} onChange={(e) => setLoanDetails({ ...loanDetails, monthlyIncome: e.target.value })} className="input" /></Field>
              <Field label="Monthly expenses"><input type="number" value={loanDetails.monthlyExpenses} onChange={(e) => setLoanDetails({ ...loanDetails, monthlyExpenses: e.target.value })} className="input" /></Field>
              <Field label="Existing debts"><input type="number" value={loanDetails.existingDebts} onChange={(e) => setLoanDetails({ ...loanDetails, existingDebts: e.target.value })} className="input" /></Field>
            </div>
          </>
        )}
        {step === 3 && <DocStep title="Identity documents" subtitle="Upload at least two" types={ID_TYPES} docs={ids} setDocs={setIds} upload={upload(setIds, ids, "Passport")} />}
        {step === 4 && (
          <DocStep
            title="Income verification"
            subtitle={personal.employment === "self-employed" ? "Self-employed: upload at least one" : "Upload at least one"}
            types={personal.employment === "self-employed" ? INCOME_SELF : INCOME_EMPLOYED}
            docs={income} setDocs={setIncome} upload={upload(setIncome, income, "Pay slip")}
          />
        )}
        {step === 5 && (
          <>
            <DocStep title="Address proof" subtitle="Upload at least one" types={ADDRESS_TYPES} docs={addressDocs} setDocs={setAddressDocs} upload={upload(setAddressDocs, addressDocs, "Utility bill")} />
            {personal.prevAddress && (
              <DocStep title="Previous address proof (optional)" subtitle="If recently moved" types={ADDRESS_TYPES} docs={prevAddrDocs} setDocs={setPrevAddrDocs} upload={upload(setPrevAddrDocs, prevAddrDocs, "Utility bill")} />
            )}
          </>
        )}
        {step === 6 && (
          <>
            <Field label="Bank name"><input value={bank.name} onChange={(e) => setBank({ ...bank, name: e.target.value })} className="input" /></Field>
            <Field label="Account holder"><input value={bank.holder} onChange={(e) => setBank({ ...bank, holder: e.target.value })} className="input" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Routing number"><input value={bank.routing} onChange={(e) => setBank({ ...bank, routing: e.target.value })} className="input" /></Field>
              <Field label="Account number"><input value={bank.account} onChange={(e) => setBank({ ...bank, account: e.target.value })} className="input" /></Field>
            </div>
            <p className="text-[11px] text-muted-foreground">Approved funds will be deposited to your CrestVest Main account. Bank details are collected for verification.</p>
          </>
        )}
        {step === 7 && (
          <div className="space-y-2 text-sm">
            <Row k="Amount" v={fmt(Number(loanDetails.amount) || 0)} />
            <Row k="Term" v={`${loanDetails.termMonths} months`} />
            <Row k="Purpose" v={loanDetails.purpose || "—"} />
            <Row k="Applicant" v={personal.fullName} />
            <Row k="Employment" v={personal.employment} />
            <Row k="Monthly income" v={fmt(Number(loanDetails.monthlyIncome) || 0)} />
            <Row k="ID docs" v={`${ids.length}`} />
            <Row k="Income docs" v={`${income.length}`} />
            <Row k="Address docs" v={`${addressDocs.length}`} />
            <Row k="Bank" v={bank.name || "—"} />
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-between gap-2">
        <button disabled={step === 1} onClick={() => setStep((s) => s - 1)} className="rounded-md border px-4 py-2 text-sm disabled:opacity-50">Back</button>
        {step < totalSteps ? (
          <button onClick={() => setStep((s) => s + 1)} className="rounded-md gradient-primary px-4 py-2 text-sm text-primary-foreground">Next</button>
        ) : (
          <button disabled={submitting} onClick={submit} className="rounded-md gradient-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">{submitting ? "Submitting…" : "Submit application"}</button>
        )}
      </div>
    </Modal>
  );
}

function DocStep({ title, subtitle, types, docs, setDocs, upload }: { title: string; subtitle: string; types: string[]; docs: DocRef[]; setDocs: (v: DocRef[]) => void; upload: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const [kind, setKind] = useState(types[0]);
  return (
    <div>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="input">
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
          <Upload className="h-4 w-4" /> Upload
          <input type="file" multiple accept="image/*,application/pdf" className="hidden" data-kind={kind} onChange={upload} />
        </label>
      </div>
      {docs.length > 0 && (
        <ul className="mt-2 divide-y rounded-lg border">
          {docs.map((d, i) => (
            <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
              <span className="flex min-w-0 items-center gap-2"><FileText className="h-3 w-3 shrink-0" /><span className="truncate">{d.name}</span><span className="shrink-0 text-muted-foreground">· {d.kind}</span></span>
              <button onClick={() => setDocs(docs.filter((_, j) => j !== i))} className="text-destructive"><X className="h-3 w-3" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) { return <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1 block text-xs text-muted-foreground">{label}</span>{children}</label>; }

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-elegant animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        {children}
      </div>
    </div>
  );
}