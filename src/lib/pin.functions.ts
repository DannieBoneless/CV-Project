import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MAX_ATTEMPTS = 4;

// Simple SHA-256 hex hash (adequate for demo PIN with attempt lock; not a
// substitute for bcrypt but avoids Worker/pgcrypto server-side dependencies).
async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const setPaymentPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ pin: z.string().regex(/^\d{4}$|^\d{6}$/, "PIN must be 4 or 6 digits") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const hash = await sha256(data.pin + ":" + context.userId);
    const { error } = await context.supabase
      .from("profiles")
      .update({ payment_pin_hash: hash, failed_pin_attempts: 0, is_locked: false })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const verifyPaymentPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ pin: z.string().min(4).max(6) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("payment_pin_hash, failed_pin_attempts, is_locked")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) throw new Error("Profile not found");
    if (profile.is_locked) {
      return { ok: false, locked: true, remaining: 0, reason: "locked" as const };
    }
    if (!profile.payment_pin_hash) {
      return { ok: false, locked: false, remaining: MAX_ATTEMPTS, reason: "no_pin" as const };
    }
    const hash = await sha256(data.pin + ":" + context.userId);
    if (hash === profile.payment_pin_hash) {
      if ((profile.failed_pin_attempts ?? 0) > 0) {
        await context.supabase
          .from("profiles")
          .update({ failed_pin_attempts: 0 })
          .eq("id", context.userId);
      }
      return { ok: true, locked: false, remaining: MAX_ATTEMPTS, reason: "ok" as const };
    }
    const next = (profile.failed_pin_attempts ?? 0) + 1;
    const locked = next >= MAX_ATTEMPTS;
    await context.supabase
      .from("profiles")
      .update({ failed_pin_attempts: next, is_locked: locked })
      .eq("id", context.userId);
    return {
      ok: false,
      locked,
      remaining: Math.max(0, MAX_ATTEMPTS - next),
      reason: "mismatch" as const,
    };
  });

export const getPinStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("payment_pin_hash, failed_pin_attempts, is_locked")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      hasPin: !!data?.payment_pin_hash,
      locked: !!data?.is_locked,
      failed: data?.failed_pin_attempts ?? 0,
    };
  });