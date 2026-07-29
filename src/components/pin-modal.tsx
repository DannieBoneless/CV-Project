import { useEffect, useRef, useState } from "react";
import { Fingerprint, ShieldAlert, ShieldCheck, MessageCircle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const WHATSAPP =
  "https://wa.me/2347045510914?text=My%20CrestVest%20account%20has%20been%20locked.%20Please%20help.";

// Mock local PIN — pure frontend validation, no backend.
const DEFAULT_PIN = "1234";
const MAX_ATTEMPTS = 4;

function getStoredPin(): string {
  try {
    return localStorage.getItem("crestvest.payment_pin") || DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
}

async function tryBiometrics(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    const challenge = new Uint8Array([
      0x8f, 0x1a, 0x3b, 0x2c, 0x4d, 0x5e, 0x6f, 0x70,
      0x81, 0x92, 0xa3, 0xb4, 0xc5, 0xd6, 0xe7, 0xf8,
    ]);
    const userId = new Uint8Array([
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    ]);
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "CrestVest" },
        user: {
          id: userId,
          name: "user@crestvest.app",
          displayName: "CrestVest User",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60_000,
        attestation: "none",
      },
    });
    return !!cred;
  } catch {
    return false;
  }
}

export function PinPromptModal({
  open,
  length = 4,
  title = "Enter your Payment PIN",
  subtitle = "Confirm this transaction with your PIN.",
  onSuccess,
  onClose,
}: {
  open: boolean;
  length?: 4 | 6;
  title?: string;
  subtitle?: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [warn, setWarn] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [stage, setStage] = useState<"bio" | "pin">("bio");
  const inputRef = useRef<HTMLInputElement>(null);

  const runBiometrics = async () => {
    setBusy(true);
    setWarn(null);
    const ok = await tryBiometrics();
    setBusy(false);
    if (ok) {
      toast.success("Biometric verification successful");
      onSuccess();
    } else {
      setStage("pin");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  useEffect(() => {
    if (open) {
      setPin("");
      setWarn(null);
      setLocked(false);
      setAttempts(0);
      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        setStage("bio");
        void runBiometrics();
      } else {
        setStage("pin");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const submit = (val: string) => {
    if (val === getStoredPin()) {
      toast.success("PIN verified");
      onSuccess();
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setPin("");
    if (next >= MAX_ATTEMPTS) {
      setLocked(true);
      setWarn(null);
    } else {
      setWarn(`Incorrect PIN. ${MAX_ATTEMPTS - next} attempts remaining.`);
    }
  };

  const cells = Array.from({ length });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-elegant animate-fade-up">
        <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
        {locked ? (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-destructive">Transactions Locked</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You entered the wrong PIN 4 times. For your security we've locked payments on your account.
              Please contact customer service via WhatsApp to unlock.
            </p>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-medium text-white shadow-elegant hover:brightness-110"
            >
              <MessageCircle className="h-4 w-4" /> Contact Customer Service
            </a>
          </div>
        ) : stage === "bio" ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <Fingerprint className="h-9 w-9 text-primary" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Biometric Verification</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use Face ID, Touch ID, or your device biometrics to authorize this payment.
            </p>
            {busy ? (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Waiting for biometrics…
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                <button
                  onClick={runBiometrics}
                  className="w-full rounded-xl gradient-primary py-3 font-medium text-primary-foreground"
                >
                  Try biometrics again
                </button>
                <button
                  onClick={() => {
                    setStage("pin");
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="w-full rounded-xl border border-input bg-background py-3 text-sm font-medium hover:bg-muted"
                >
                  Use PIN instead
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <ShieldCheck className="h-9 w-9 text-primary" />
            </div>
            <h2 className="mt-4 text-xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6 flex justify-center gap-2">
              {cells.map((_, i) => (
                <div
                  key={i}
                  className={`flex h-12 w-10 items-center justify-center rounded-lg border text-xl font-bold ${
                    pin.length > i ? "border-primary bg-primary/10" : "border-input bg-background"
                  }`}
                >
                  {pin[i] ? "•" : ""}
                </div>
              ))}
            </div>
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, length);
                setPin(v);
                setWarn(null);
                if (v.length === length) submit(v);
              }}
              className="sr-only"
              aria-label="Payment PIN"
            />
            <button
              onClick={() => inputRef.current?.focus()}
              className="mt-3 text-xs text-primary underline-offset-4 hover:underline"
            >
              Tap to enter PIN
            </button>
            {warn && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {warn}
              </p>
            )}
            <p className="mt-4 text-[11px] text-muted-foreground">Demo PIN: 1234</p>
          </div>
        )}
      </div>
    </div>
  );
}