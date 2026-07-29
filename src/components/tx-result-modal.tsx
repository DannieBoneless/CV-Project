import { CheckCircle2, XCircle, MessageCircle } from "lucide-react";

export type TxResult = {
  open: boolean;
  status: "success" | "failure";
  title?: string;
  message?: string;
};

const WHATSAPP =
  "https://wa.me/2347045510914?text=I%20need%20assistance%20with%20a%20failed%20transaction";

export function TxResultModal({
  result,
  onClose,
}: {
  result: TxResult;
  onClose: () => void;
}) {
  if (!result.open) return null;
  const ok = result.status === "success";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-fade-up"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-elegant animate-fade-up">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            ok ? "bg-emerald-500/15" : "bg-destructive/15"
          }`}
        >
          {ok ? (
            <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-pulse-glow" />
          ) : (
            <XCircle className="h-12 w-12 text-destructive" />
          )}
        </div>
        <h2 className={`mt-5 text-2xl font-bold ${ok ? "text-emerald-500" : "text-destructive"}`}>
          {result.title ?? (ok ? "Yes! Payment Sent successfully." : "Transaction Failed")}
        </h2>
        {result.message && (
          <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
        )}
        {!ok && (
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-medium text-white shadow-elegant hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" /> Contact Customer Support via WhatsApp
          </a>
        )}
        <button
          onClick={onClose}
          className={`mt-3 w-full rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted`}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function ProcessingModal({ open, title = "Processing…", subtitle }: { open: boolean; title?: string; subtitle?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-elegant animate-fade-up">
        <div className="mx-auto h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <h2 className="mt-5 text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <p className="mt-4 text-xs text-muted-foreground">Please do not close this window.</p>
      </div>
    </div>
  );
}