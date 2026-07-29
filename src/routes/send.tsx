import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { fmt } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PinPromptModal } from "@/components/pin-modal";
import { TxResultModal, ProcessingModal, type TxResult } from "@/components/tx-result-modal";

export const Route = createFileRoute("/send")({ component: Send });

function Send() {
  const { user, sendToUser, externalSend } = useApp();
  const nav = useNavigate();
  const [mode, setMode] = useState<"internal" | "external">("internal");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [bank, setBank] = useState("");
  const [ownEmail, setOwnEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [result, setResult] = useState<TxResult>({ open: false, status: "success" });
  if (!user) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinOpen(true);
  };
  const runAfterPin = async () => {
    setPinOpen(false);
    const amt = Number(amount);
    setBusy(true);
    try {
      if (mode === "internal") {
        await sendToUser(email, amt);
        setResult({
          open: true,
          status: "success",
          title: "Yes! Payment Sent successfully.",
          message: `${fmt(amt)} sent to ${email}.`,
        });
      } else {
        // External: 10s processing then forced failure
        setProcessing(true);
        await new Promise((r) => setTimeout(r, 10_000));
        setProcessing(false);
        await externalSend(recipient, bank, ownEmail, amt);
        setResult({
          open: true,
          status: "failure",
          title: "Transaction Failed",
          message: "This transaction could not be completed. Please contact Customer Support for assistance.",
        });
      }
    } catch (err) {
      setProcessing(false);
      setResult({ open: true, status: "failure", title: "Transaction Failed", message: (err as Error).message });
    } finally { setBusy(false); }
  };
  return (
    <DashboardShell title="Send Money">
      <div className="mx-auto max-w-md">
        <button onClick={() => history.back()} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
        <div className="mb-3 grid grid-cols-2 rounded-xl border p-1 text-sm">
          <button className={`rounded-lg py-2 ${mode === "internal" ? "gradient-primary text-primary-foreground" : ""}`} onClick={() => setMode("internal")}>To CrestVest user</button>
          <button className={`rounded-lg py-2 ${mode === "external" ? "gradient-primary text-primary-foreground" : ""}`} onClick={() => setMode("external")}>To external bank</button>
        </div>
        <form onSubmit={submit} className="glass rounded-2xl p-5 space-y-4">
          {mode === "internal" ? (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Recipient's email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="friend@email.com" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </label>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Recipient account / name</span>
                <input value={recipient} onChange={(e) => setRecipient(e.target.value)} required className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Bank name</span>
                <input value={bank} onChange={(e) => setBank(e.target.value)} required className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Your account email (must match)</span>
                <input value={ownEmail} onChange={(e) => setOwnEmail(e.target.value)} type="email" required className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              </label>
            </>
          )}
          <div>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount</span>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
              <span className="text-2xl font-bold text-primary">$</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" step="0.01" required className="w-full bg-transparent text-2xl font-semibold outline-none" placeholder="0.00" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Available balance: {fmt(user.balances.main)}</div>
          </div>
          <button disabled={busy || Number(amount) > user.balances.main} className="w-full rounded-xl gradient-primary py-3 font-medium text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? "Processing…" : "Send transfer"}
          </button>
          {mode === "external" && (
            <p className="text-center text-xs text-muted-foreground">External transfers may take 10 seconds to process. If your transfer fails, contact support via WhatsApp.</p>
          )}
        </form>
      </div>
      <PinPromptModal open={pinOpen} onClose={() => setPinOpen(false)} onSuccess={runAfterPin} />
      <ProcessingModal open={processing} title="Processing transaction…" subtitle="Contacting the recipient bank" />
      <TxResultModal
        result={result}
        onClose={() => {
          setResult({ ...result, open: false });
          if (result.status === "success") nav({ to: "/dashboard" });
        }}
      />
    </DashboardShell>
  );
}