# CrestVest → Supabase Migration + Feature Upgrade

Big scope. I'll ship it in one turn but sequenced so the app is never broken. AI chat is deferred per your answer.

## Phase A — Backend (Lovable Cloud / Supabase)

Enable Lovable Cloud, then run one migration that creates the full schema with RLS + GRANTs:

- `profiles` — `id (auth.users)`, `full_name`, `first_name`, `last_name`, `email`, `avatar_url`, `phone`, `address`, `city`, `country`, `payment_pin_hash`, `failed_pin_attempts int default 0`, `is_locked bool default false`, timestamps. Trigger `on_auth_user_created` inserts profile row.
- `balances` — `user_id pk`, `main`, `savings`, `investment` numeric.
- `transactions` — `id`, `user_id`, `type`, `amount`, `category`, `status` (success/failed/pending), `note`, `ref`, `counterparty`, `metadata jsonb`, `created_at`.
- `loans` — `id`, `user_id`, `amount_requested`, `term_months`, `purpose`, `status` (pending/approved/rejected/disbursed), `metadata jsonb`, `created_at`.
- `goals` — savings goals (mode, target, current, cadence, next_run_at).
- `trades` — open/closed positions.
- `notifications` — `id`, `user_id`, `title`, `body`, `read`, `created_at`.
- `settings` — per-user preferences.
- Storage bucket `avatars` (public read, authed write to own folder).

RLS on every table: `auth.uid() = user_id` for select/insert/update/delete. Publish tables to Realtime.

## Phase B — Auth + PIN

- Refactor `app-context.tsx`: replace localStorage with Supabase. `supabase.auth` for sessions, queries for balances/txs/loans/goals/trades.
- Signup wizard adds a **PIN step** (4- or 6-digit) — hashed server-side via a `set_payment_pin` server function using bcrypt-style (pgcrypto `crypt`).
- `verify_pin(pin)` server fn: compares hash, increments `failed_pin_attempts` on miss, locks at 4 failures. Returns `{ ok, remaining, locked }`.
- Managed `_authenticated` gate (already set) covers protected routes. Add `/auth` public route (already exists) with PIN capture on signup.

## Phase C — UI/UX features

- **Greeting + weather widget** in `DashboardShell` header: time-based ("Good morning, {first_name}"), plus a weather chip. Weather: use `open-meteo` (no key) via browser geolocation, fallback to a mock sunny state if denied.
- **Centered result modal** component `<TxResultModal />` — animated green check (success) / red X (failure), body copy, action buttons. Reused across send/deposit/withdraw/transfer/loan-payment.
- **PIN prompt modal** `<PinPromptModal />` — 4/6-digit boxes, warning line "Incorrect PIN. N attempts remaining.", lock screen with WhatsApp CTA at 4 fails.
- **External spend flow** (withdraw + external send): 10 s processing screen → forced failure result modal with "Contact Customer Support via WhatsApp" deep link. Internal transfers still succeed instantly.
- **Loan application form**: rebuild inputs with consistent `input` utility class, labels, focus rings, inline zod validation, profile-pic preview + upload step.
- **Profile picture**: upload/remove via Supabase Storage `avatars/{user_id}/…`, shown in dashboard header, mobile drawer, settings, and near the email/sign-out block.
- **Analytics page**: recharts — category pie, weekly bars, monthly line, income vs expense. Subscribes to `transactions` realtime channel; recomputes on insert/update.
- **Notifications**: realtime channel on `notifications`; navbar badge count + toast on insert.

## Phase D — Cleanup

- Remove localStorage-based state and mock timers (already partially done).
- Keep marketing routes untouched.
- Update every dashboard route to read from Supabase via TanStack Query + `useSuspenseQuery` where reasonable.

## Technical notes

- Server fns live under `src/lib/*.functions.ts` using `requireSupabaseAuth`; admin-only ops (pin hash write, locking) load `client.server` inside handlers.
- New format keys — no hand-rolled clients; use `context.supabase` + `supabaseAdmin`.
- Head metadata on every content route kept.
- No AI chat wiring this turn.

If this looks right, I'll build it.