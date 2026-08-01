/**
 * AppContext — the single source of truth for auth, wallet, investments,
 * transactions, notifications and theme.
 *
 * Balances, transactions, goals, loans, trades, and notifications are now
 * backed by Supabase. buyVault, storePurchase, sendToUser, and externalSend
 * remain on localStorage for now (no matching tables / cross-user lookup yet).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";

export type Balances = { main: number; savings: number; investment: number };
export type Wallet = "main" | "savings" | "investment";

export interface User {
  id: string; // = auth user id
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tier: "Starter" | "Gold" | "Legend";
  balances: Balances;
  cardBalance: number;
  hasDeposited: boolean;
  createdAt: string;
}

export type TxType =
  | "transfer" | "send" | "deposit" | "withdraw" | "external_send"
  | "vault" | "store" | "loan"
  | "trade-open" | "trade-close"
  | "invest-transfer"
  | "savings-deposit" | "savings-auto" | "savings-withdraw"
  | "goal-created" | "goal-completed"
  | "loan-submitted" | "loan-approved" | "loan-declined"
  | "loan-disbursed" | "loan-payment";

export interface Tx {
  id: string;
  ref: string;
  type: TxType;
  amount: number;
  from?: Wallet | "external";
  to?: Wallet | "external";
  status: "completed" | "pending" | "failed";
  note: string;
  at: string;
  goalId?: string;
  loanId?: string;
  tradeId?: string;
}

export interface Trade {
  id: string;
  sym: string;
  name: string;
  side: "buy" | "sell";
  qty: number;
  openPrice: number;
  openAt: string;
  status: "open" | "closed";
  closePrice?: number;
  closeAt?: string;
  pnl?: number;
  pnlPct?: number;
}

export type GoalMode = "one-time" | "manual" | "daily" | "weekly" | "monthly";
export type GoalStatus = "active" | "paused" | "completed" | "cancelled";
export interface GoalHistory {
  id: string; at: string; amount: number;
  type: "deposit" | "withdraw" | "auto" | "auto-failed";
}
export interface Goal {
  id: string;
  name: string;
  target: number;
  dueDate?: string;
  description?: string;
  saved: number;
  status: GoalStatus;
  mode: GoalMode;
  autoAmount?: number;
  lastRunAt?: string;
  createdAt: string;
  history: GoalHistory[];
}

export type LoanStatus =
  | "draft" | "submitted" | "under-review" | "additional-docs-required"
  | "approved" | "declined" | "disbursed" | "closed";

export interface DocRef { name: string; size: number; type: string; kind: string }

export interface Loan {
  id: string;
  amount: number;
  purpose: string;
  termMonths: number;
  apr: number;
  status: LoanStatus;
  reason?: string;
  submittedAt: string;
  disbursedAt?: string;
  remaining: number;
  monthlyPayment: number;
  nextPaymentAt?: string;
  payments: { at: string; amount: number }[];
  personal: Record<string, string>;
  finances: { monthlyIncome: number; monthlyExpenses: number; existingDebts: number; employment: string };
  docs: { ids: DocRef[]; income: DocRef[]; address: DocRef[]; prevAddress: DocRef[] };
  bank: { name: string; holder: string; routing: string; account: string };
}

export interface Vault {
  id: string;
  plan: "Starter" | "Growth" | "Legend";
  principal: number;
  apy: number;
  days: number;
  startAt: string;
}

export interface Notif {
  id: string;
  title: string;
  message: string;
  read: boolean;
  at: string;
}

const MOCK: User = {
  id: "user@invest.com",
  email: "user@invest.com",
  password: "password123",
  firstName: "Alex",
  lastName: "Morgan",
  tier: "Gold",
  balances: { main: 10000, savings: 1250, investment: 0 },
  cardBalance: 500,
  hasDeposited: true,
  createdAt: new Date().toISOString(),
};

async function buildUserFromSupabase(authUser: {
  id: string; email?: string | null;
}): Promise<User | null> {
  if (!authUser.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  let { data: balanceRow } = await supabase
    .from("balances")
    .select("*")
    .eq("user_id", authUser.id)
    .maybeSingle();

  // Safety net: create a balances row if the signup trigger didn't
  if (!balanceRow) {
    const { data: created } = await supabase
      .from("balances")
      .insert({ user_id: authUser.id, main: 0, savings: 0, investment: 0 })
      .select()
      .maybeSingle();
    balanceRow = created;
  }

  return {
    id: authUser.id,
    email: authUser.email,
    password: "",
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    phone: profile?.phone || undefined,
    address: profile?.address || undefined,
    city: profile?.city || undefined,
    country: profile?.country || undefined,
    tier: "Starter",
    balances: {
      main: balanceRow?.main ?? 0,
      savings: balanceRow?.savings ?? 0,
      investment: balanceRow?.investment ?? 0,
    },
    cardBalance: 0,
    hasDeposited: (balanceRow?.main ?? 0) > 0,
    createdAt: profile?.created_at || new Date().toISOString(),
  };
}

async function insertTx(userId: string, tx: {
  type: string; amount: number; category?: string; status?: string;
  note?: string; ref?: string; counterparty?: string; metadata?: Record<string, unknown>;
}) {
  await supabase.from("transactions").insert({
    user_id: userId,
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    status: tx.status ?? "success",
    note: tx.note,
    ref: tx.ref,
    counterparty: tx.counterparty,
    metadata: tx.metadata ?? {},
  });
}

async function updateBalances(userId: string, patch: Partial<{ main: number; savings: number; investment: number }>) {
  const { data } = await supabase
    .from("balances")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .maybeSingle();
  return data;
}

async function loadUserData(userId: string) {
  const [{ data: goalRows }, { data: loanRows }, { data: tradeRows }, { data: notifRows }, { data: txRows }] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("loans").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("trades").select("*").eq("user_id", userId).order("opened_at", { ascending: false }),
    supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const goals: Goal[] = (goalRows ?? []).map((g: any) => ({
    id: g.id, name: g.name, target: g.target, saved: g.current, status: g.status,
    mode: g.mode, createdAt: g.created_at, history: [],
    dueDate: g.metadata?.dueDate, description: g.metadata?.description, autoAmount: g.metadata?.autoAmount,
  }));

  const loans: Loan[] = (loanRows ?? []).map((l: any) => ({
    id: l.id, amount: l.amount_requested, purpose: l.purpose, termMonths: l.term_months,
    apr: l.metadata?.apr ?? 12, status: l.status, submittedAt: l.created_at,
    remaining: l.metadata?.remaining ?? l.amount_requested, monthlyPayment: l.metadata?.monthlyPayment ?? 0,
    payments: l.metadata?.payments ?? [], personal: l.metadata?.personal ?? {}, finances: l.metadata?.finances,
    docs: l.metadata?.docs, bank: l.metadata?.bank,
  }));

  const trades: Trade[] = (tradeRows ?? []).map((t: any) => ({
    id: t.id, sym: t.asset, name: t.asset, side: t.side, qty: t.qty, openPrice: t.entry_price,
    openAt: t.opened_at, status: t.status, closePrice: t.exit_price, closeAt: t.closed_at, pnl: t.pnl,
  }));

  const notifs: Notif[] = (notifRows ?? []).map((n: any) => ({
    id: n.id, title: n.title, message: n.body, read: n.read, at: n.created_at,
  }));

  const txs: Tx[] = (txRows ?? []).map((t: any) => ({
    id: t.id, ref: t.ref ?? "", type: t.type, amount: t.amount, status: t.status, note: t.note ?? "", at: t.created_at,
  }));

  return { goals, loans, trades, notifs, txs };
}

const K = {
  users: "cv.users",
  session: "cv.session",
  tx: (id: string) => `cv.tx.${id}`,
  vaults: (id: string) => `cv.vaults.${id}`,
  notifs: (id: string) => `cv.notifs.${id}`,
  trades: (id: string) => `cv.trades.${id}`,
  goals: (id: string) => `cv.goals.${id}`,
  loans: (id: string) => `cv.loans.${id}`,
  theme: "cv.theme",
  cookie: "cv.cookie",
};

function loadUsers(): Record<string, User> {
  if (typeof window === "undefined") return { [MOCK.id]: MOCK };
  try {
    const raw = localStorage.getItem(K.users);
    const data = raw ? JSON.parse(raw) : {};
    if (!data[MOCK.id]) data[MOCK.id] = MOCK;
    return data;
  } catch {
    return { [MOCK.id]: MOCK };
  }
}
function saveUsers(u: Record<string, User>) {
  localStorage.setItem(K.users, JSON.stringify(u));
}
function ls<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fb;
  } catch {
    return fb;
  }
}

interface Ctx {
  user: User | null;
  ready: boolean;
  txs: Tx[];
  vaults: Vault[];
  notifs: Notif[];
  trades: Trade[];
  goals: Goal[];
  loans: Loan[];
  theme: "light" | "dark";
  toggleTheme: () => void;
  login: (email: string, pw: string) => Promise<User>;
  register: (data: Partial<User> & { password: string; email: string }) => Promise<User>;
  logout: () => void;
  internalTransfer: (from: Wallet, to: Wallet, amount: number) => Promise<void>;
  sendToUser: (email: string, amount: number) => Promise<void>;
  externalSend: (recipient: string, bank: string, userEmail: string, amount: number) => Promise<void>;
  deposit: (method: string, amount: number) => Promise<void>;
  requestLoan: (amount: number, email: string) => Promise<void>;
  buyVault: (plan: "Starter" | "Growth" | "Legend", amount: number) => Promise<void>;
  storePurchase: (item: string, amount: number) => Promise<void>;
  markAllNotifsRead: () => void;
  addFundsToInvest: (amount: number) => Promise<void>;
  moveInvestToMain: (amount: number) => Promise<void>;
  openTrade: (input: { sym: string; name: string; side: "buy" | "sell"; qty: number; price: number }) => Promise<void>;
  closeTrade: (id: string, currentPrice: number) => Promise<void>;
  createGoal: (input: Omit<Goal, "id" | "saved" | "status" | "createdAt" | "history"> & { initialDeposit?: number }) => Promise<Goal>;
  fundGoal: (id: string, amount: number) => Promise<void>;
  withdrawGoal: (id: string, amount: number) => Promise<void>;
  editGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
  pauseGoal: (id: string) => Promise<void>;
  resumeGoal: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  submitLoan: (input: Omit<Loan, "id" | "status" | "submittedAt" | "remaining" | "monthlyPayment" | "payments" | "apr">) => Promise<Loan>;
  repayLoan: (id: string, amount: number) => Promise<void>;
  payoffLoan: (id: string) => Promise<void>;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Theme init
    const saved = localStorage.getItem(K.theme) as "light" | "dark" | null;
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const t = saved ?? prefers;
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");

    // Real Supabase session init
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = await buildUserFromSupabase(session.user);
        if (u) {
          setUser(u);
          setVaults(ls(K.vaults(u.id), []));
          const { goals, loans, trades, notifs, txs } = await loadUserData(u.id);
          setGoals(goals);
          setLoans(loans);
          setTrades(trades);
          setNotifs(notifs);
          setTxs(txs);
        }
      }
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        const u = await buildUserFromSupabase(session.user);
        if (u) setUser(u);
      } else {
        setUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Realtime: reflect balance edits made in Supabase (e.g. by an admin) live
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("balances-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "balances", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { main: number; savings: number; investment: number };
          setUser((prev) => (prev ? { ...prev, balances: { main: row.main, savings: row.savings, investment: row.investment } } : prev));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Realtime: reflect goals/loans/trades/notifications edits made in Supabase live
  useEffect(() => {
    if (!user) return;
    const uid = user.id;

    const mapGoal = (g: any): Goal => ({
      id: g.id, name: g.name, target: g.target, saved: g.current, status: g.status,
      mode: g.mode, createdAt: g.created_at, history: [],
      dueDate: g.metadata?.dueDate, description: g.metadata?.description, autoAmount: g.metadata?.autoAmount,
    });
    const mapLoan = (l: any): Loan => ({
      id: l.id, amount: l.amount_requested, purpose: l.purpose, termMonths: l.term_months,
      apr: l.metadata?.apr ?? 12, status: l.status, submittedAt: l.created_at,
      remaining: l.metadata?.remaining ?? l.amount_requested, monthlyPayment: l.metadata?.monthlyPayment ?? 0,
      payments: l.metadata?.payments ?? [], personal: l.metadata?.personal ?? {}, finances: l.metadata?.finances,
      docs: l.metadata?.docs, bank: l.metadata?.bank,
    });
    const mapTrade = (t: any): Trade => ({
      id: t.id, sym: t.asset, name: t.asset, side: t.side, qty: t.qty, openPrice: t.entry_price,
      openAt: t.opened_at, status: t.status, closePrice: t.exit_price, closeAt: t.closed_at, pnl: t.pnl,
    });
    const mapNotif = (n: any): Notif => ({
      id: n.id, title: n.title, message: n.body, read: n.read, at: n.created_at,
    });

    const channel = supabase
      .channel("app-data-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "goals", filter: `user_id=eq.${uid}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          setGoals((prev) => prev.filter((g) => g.id !== (payload.old as any).id));
        } else {
          const row = mapGoal(payload.new);
          setGoals((prev) => {
            const exists = prev.some((g) => g.id === row.id);
            return exists ? prev.map((g) => (g.id === row.id ? { ...row, history: g.history } : g)) : [row, ...prev];
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "loans", filter: `user_id=eq.${uid}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          setLoans((prev) => prev.filter((l) => l.id !== (payload.old as any).id));
        } else {
          const row = mapLoan(payload.new);
          setLoans((prev) => {
            const exists = prev.some((l) => l.id === row.id);
            return exists ? prev.map((l) => (l.id === row.id ? row : l)) : [row, ...prev];
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trades", filter: `user_id=eq.${uid}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          setTrades((prev) => prev.filter((t) => t.id !== (payload.old as any).id));
        } else {
          const row = mapTrade(payload.new);
          setTrades((prev) => {
            const exists = prev.some((t) => t.id === row.id);
            return exists ? prev.map((t) => (t.id === row.id ? row : t)) : [row, ...prev];
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          setNotifs((prev) => prev.filter((n) => n.id !== (payload.old as any).id));
        } else {
          const row = mapNotif(payload.new);
          setNotifs((prev) => {
            const exists = prev.some((n) => n.id === row.id);
            return exists ? prev.map((n) => (n.id === row.id ? row : n)) : [row, ...prev];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const persistUser = useCallback((u: User) => {
    const all = loadUsers();
    all[u.id] = u;
    saveUsers(all);
    setUser({ ...u });
  }, []);

  const persistVaults = useCallback((id: string, next: Vault[]) => {
    localStorage.setItem(K.vaults(id), JSON.stringify(next));
    setVaults(next);
  }, []);
  const persistNotifs = useCallback((id: string, next: Notif[]) => {
    localStorage.setItem(K.notifs(id), JSON.stringify(next));
    setNotifs(next);
  }, []);

  const shortRef = () => "CV-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const pushTx = (u: User, tx: Omit<Tx, "id" | "at" | "ref"> & { ref?: string }) => {
    const entry: Tx = {
      ...tx,
      ref: tx.ref ?? shortRef(),
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    };
    setTxs((prev) => [entry, ...prev]);
  };
  const pushNotif = (u: User, n: Omit<Notif, "id" | "at" | "read">) => {
    const next = [
      { ...n, id: crypto.randomUUID(), at: new Date().toISOString(), read: false },
      ...ls<Notif[]>(K.notifs(u.id), []),
    ];
    persistNotifs(u.id, next);
  };

  const toggleTheme = () => {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem(K.theme, t);
  };

  const login: Ctx["login"] = async (email, pw) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error || !data.user) throw new Error(error?.message || "Invalid email or password");
    const u = await buildUserFromSupabase(data.user);
    if (!u) throw new Error("Could not load account");
    setUser(u);
    setVaults(ls(K.vaults(u.id), []));
    const { goals, loans, trades, notifs, txs } = await loadUserData(u.id);
    setGoals(goals);
    setLoans(loans);
    setTrades(trades);
    setNotifs(notifs);
    setTxs(txs);
    return u;
  };

  const register: Ctx["register"] = async (data) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) throw new Error("Supabase signup did not complete");

    // Ensure profile row exists / is up to date (in case no trigger ran it)
    await supabase.from("profiles").upsert({
      id: authUser.id,
      email: data.email,
      first_name: data.firstName || "",
      last_name: data.lastName || "",
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      country: data.country || null,
    });

    const u = await buildUserFromSupabase(authUser);
    if (!u) throw new Error("Could not create account");
    setUser(u);
    setTxs([]);
    setVaults([]);
    setGoals([]);
    setLoans([]);
    setTrades([]);
    const welcome: Notif = {
      id: crypto.randomUUID(),
      title: "Welcome to CrestVest",
      message: "Deposit $100+ to unlock your $200 welcome bonus.",
      read: false,
      at: new Date().toISOString(),
    };
    persistNotifs(u.id, [welcome]);
    return u;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTxs([]);
    setVaults([]);
    setNotifs([]);
    setTrades([]);
    setGoals([]);
    setLoans([]);
  };

  const internalTransfer: Ctx["internalTransfer"] = async (from, to, amount) => {
    if (!user) throw new Error("Not signed in");
    if (from === to) throw new Error("Choose different accounts");
    if (amount <= 0) throw new Error("Enter a valid amount");
    if (user.balances[from] < amount) throw new Error("Insufficient balance");
    const nextBalances = {
      ...user.balances,
      [from]: user.balances[from] - amount,
      [to]: user.balances[to] + amount,
    };
    const row = await updateBalances(user.id, nextBalances);
    if (!row) throw new Error("Failed to update balance");
    setUser({ ...user, balances: nextBalances });
    await insertTx(user.id, { type: "transfer", amount, category: `${from}->${to}`, note: `Internal ${from} → ${to}` });
    pushTx(user, { type: "transfer", amount, from, to, status: "completed", note: `Internal ${from} → ${to}` });
  };

  const sendToUser: Ctx["sendToUser"] = async (email, amount) => {
    if (!user) throw new Error("Not signed in");
    if (amount <= 0) throw new Error("Enter a valid amount");
    if (user.balances.main < amount) throw new Error("Insufficient balance");
    const all = loadUsers();
    const recip = all[email.toLowerCase()];
    if (!recip) throw new Error("No CrestVest user with that email");
    const meNext: User = { ...user, balances: { ...user.balances, main: user.balances.main - amount } };
    const rNext: User = { ...recip, balances: { ...recip.balances, main: recip.balances.main + amount } };
    all[meNext.id] = meNext;
    all[rNext.id] = rNext;
    saveUsers(all);
    setUser({ ...meNext });
    pushTx(meNext, { type: "send", amount, from: "main", status: "completed", note: `Sent to ${email}` });
  };

  const externalSend: Ctx["externalSend"] = async (recipient, bank, userEmail, amount) => {
    if (!user) throw new Error("Not signed in");
    if (userEmail.toLowerCase() !== user.email) throw new Error("Email must match your account email");
    pushTx(user, {
      type: "external_send",
      amount,
      from: "main",
      to: "external",
      status: "pending",
      note: `External transfer to ${recipient} (${bank}) — pending review`,
    });
    pushNotif(user, {
      title: "External transfer submitted",
      message: `Your transfer of $${amount} to ${recipient} is pending review.`,
    });
  };

  const deposit: Ctx["deposit"] = async (method, amount) => {
    if (!user) throw new Error("Not signed in");
    await insertTx(user.id, {
      type: "deposit", amount, status: "pending",
      note: `${method} deposit — pending verification`, category: method,
    });
    pushTx(user, {
      type: "deposit", amount, to: "main", status: "pending",
      note: `${method} deposit — pending verification`,
    });
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Deposit Received",
      body: `Your ${method} deposit is pending verification. Send proof via WhatsApp to speed up.`,
    });
    pushNotif(user, {
      title: "Deposit Received",
      message: `Your ${method} deposit is pending verification. Send proof via WhatsApp to speed up.`,
    });
  };

  const requestLoan: Ctx["requestLoan"] = async (amount, email) => {
    if (!user) throw new Error("Not signed in");
    if (email.toLowerCase() !== user.email) throw new Error("Email must match your account email");
    pushTx(user, { type: "loan", amount, status: "pending", note: `Loan application — $${amount}` });
    pushNotif(user, {
      title: "Loan Application Received",
      message: "Your loan request has been submitted. Our team will review and reach out.",
    });
  };

  const buyVault: Ctx["buyVault"] = async (plan, amount) => {
    if (!user) throw new Error("Not signed in");
    if (user.balances.investment < amount) throw new Error("Insufficient investment cash. Add funds from main balance first.");
    const days = plan === "Starter" ? 30 : plan === "Growth" ? 90 : 180;
    const apy = plan === "Starter" ? 5 : plan === "Growth" ? 8 : 12;
    const next: User = {
      ...user,
      balances: { ...user.balances, investment: user.balances.investment - amount },
    };
    persistUser(next);
    const v: Vault = { id: crypto.randomUUID(), plan, principal: amount, apy, days, startAt: new Date().toISOString() };
    persistVaults(next.id, [v, ...ls<Vault[]>(K.vaults(next.id), [])]);
    pushTx(next, { type: "vault", amount, from: "investment", status: "completed", note: `${plan} Vault (${days}d ${apy}% APY)` });
  };

  const storePurchase: Ctx["storePurchase"] = async (item, amount) => {
    if (!user) throw new Error("Not signed in");
    if (user.cardBalance < amount) throw new Error("Insufficient card balance");
    const next: User = { ...user, cardBalance: user.cardBalance - amount };
    persistUser(next);
    pushTx(next, { type: "store", amount, status: "completed", note: `Store: ${item}` });
  };

  const markAllNotifsRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addFundsToInvest: Ctx["addFundsToInvest"] = async (amount) => {
    if (!user) throw new Error("Not signed in");
    if (user.balances.main < amount) throw new Error("Insufficient main balance");
    const nextBalances = {
      ...user.balances,
      main: user.balances.main - amount,
      investment: user.balances.investment + amount,
    };
    const row = await updateBalances(user.id, nextBalances);
    if (!row) throw new Error("Failed to update balance");
    setUser({ ...user, balances: nextBalances });
    await insertTx(user.id, { type: "invest-transfer", amount, category: "main->investment", note: "Main → Investment" });
    pushTx(user, { type: "invest-transfer", amount, from: "main", to: "investment", status: "completed", note: "Main → Investment" });
  };

  const moveInvestToMain: Ctx["moveInvestToMain"] = async (amount) => {
    if (!user) throw new Error("Not signed in");
    if (amount <= 0) throw new Error("Enter a valid amount");
    if (user.balances.investment < amount) throw new Error("Insufficient investment balance");
    const nextBalances = {
      ...user.balances,
      investment: user.balances.investment - amount,
      main: user.balances.main + amount,
    };
    const row = await updateBalances(user.id, nextBalances);
    if (!row) throw new Error("Failed to update balance");
    setUser({ ...user, balances: nextBalances });
    await insertTx(user.id, { type: "invest-transfer", amount, category: "investment->main", note: "Investment → Main" });
    pushTx(user, { type: "invest-transfer", amount, from: "investment", to: "main", status: "completed", note: "Investment → Main" });
  };

  const openTrade: Ctx["openTrade"] = async ({ sym, name, side, qty, price }) => {
    if (!user) throw new Error("Not signed in");
    if (qty <= 0) throw new Error("Quantity must be greater than 0");
    const cost = qty * price;
    if (user.balances.investment < cost) throw new Error("Insufficient investment cash. Move funds from Main first.");
    const nextBalances = { ...user.balances, investment: user.balances.investment - cost };
    const balRow = await updateBalances(user.id, nextBalances);
    if (!balRow) throw new Error("Failed to update balance");
    setUser({ ...user, balances: nextBalances });

    const { data: tradeRow } = await supabase
      .from("trades")
      .insert({ user_id: user.id, asset: sym, side, qty, entry_price: price, status: "open" })
      .select()
      .maybeSingle();

    const t: Trade = {
      id: tradeRow!.id, sym, name, side, qty, openPrice: price,
      openAt: tradeRow!.opened_at, status: "open",
    };
    setTrades((prev) => [t, ...prev]);

    await insertTx(user.id, {
      type: "trade-open", amount: cost, category: "investment",
      note: `${side.toUpperCase()} ${qty} ${sym} @ $${price.toFixed(2)}`,
      metadata: { trade_id: t.id },
    });
    pushTx(user, { type: "trade-open", amount: cost, from: "investment", status: "completed", note: `${side.toUpperCase()} ${qty} ${sym} @ $${price.toFixed(2)}`, tradeId: t.id });
  };

  const closeTrade: Ctx["closeTrade"] = async (id, currentPrice) => {
    if (!user) throw new Error("Not signed in");
    const t = trades.find((x) => x.id === id);
    if (!t || t.status !== "open") throw new Error("Trade not found");
    const gross = t.qty * currentPrice;
    const cost = t.qty * t.openPrice;
    const rawPnl = gross - cost;
    const pnl = t.side === "buy" ? rawPnl : -rawPnl;
    const pnlPct = (pnl / cost) * 100;
    const proceeds = Math.max(0, cost + pnl);

    await supabase
      .from("trades")
      .update({ status: "closed", exit_price: currentPrice, pnl, closed_at: new Date().toISOString() })
      .eq("id", id);

    const nextBalances = { ...user.balances, investment: user.balances.investment + proceeds };
    await updateBalances(user.id, nextBalances);
    setUser({ ...user, balances: nextBalances });

    setTrades((prev) => prev.map((x) => x.id === id ? {
      ...x, status: "closed", closePrice: currentPrice, closeAt: new Date().toISOString(), pnl, pnlPct,
    } : x));

    await insertTx(user.id, {
      type: "trade-close", amount: Math.abs(pnl), category: "investment",
      status: pnl >= 0 ? "success" : "failed",
      note: `Closed ${t.side.toUpperCase()} ${t.qty} ${t.sym} · ${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)} (${pnlPct.toFixed(2)}%)`,
      metadata: { trade_id: id },
    });
    pushTx(user, {
      type: "trade-close", amount: Math.abs(pnl), to: "investment",
      status: pnl >= 0 ? "completed" : "failed",
      note: `Closed ${t.side.toUpperCase()} ${t.qty} ${t.sym} · ${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)} (${pnlPct.toFixed(2)}%)`,
      tradeId: id,
    });
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: pnl >= 0 ? "Trade closed — profit" : "Trade closed — loss",
      body: `${t.sym}: ${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)} (${pnlPct.toFixed(2)}%)`,
    });
    pushNotif(user, {
      title: pnl >= 0 ? "Trade closed — profit" : "Trade closed — loss",
      message: `${t.sym}: ${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)} (${pnlPct.toFixed(2)}%)`,
    });
  };

  const createGoal: Ctx["createGoal"] = async (input) => {
    if (!user) throw new Error("Not signed in");
    if (!input.name.trim()) throw new Error("Give your goal a name");
    if (input.target <= 0) throw new Error("Target must be greater than 0");

    let current = 0;
    let status: GoalStatus = "active";
    const nextBalances = { ...user.balances };

    if (input.mode === "one-time") {
      if (user.balances.main < input.target) throw new Error("Insufficient main balance for one-time deposit");
      nextBalances.main -= input.target;
      current = input.target;
      status = "completed";
    } else if (input.initialDeposit && input.initialDeposit > 0) {
      if (user.balances.main < input.initialDeposit) throw new Error("Insufficient main balance");
      nextBalances.main -= input.initialDeposit;
      nextBalances.savings += input.initialDeposit;
      current = input.initialDeposit;
    }

    if (current > 0) await updateBalances(user.id, nextBalances);
    setUser({ ...user, balances: nextBalances });

    const { data: row } = await supabase
      .from("goals")
      .insert({
        user_id: user.id, name: input.name.trim(), target: input.target,
        current, mode: input.mode, cadence: input.mode === "one-time" ? null : input.mode,
        status, metadata: { dueDate: input.dueDate, description: input.description, autoAmount: input.autoAmount },
      })
      .select()
      .maybeSingle();

    const goal: Goal = {
      id: row!.id, name: input.name, target: input.target, dueDate: input.dueDate,
      description: input.description, saved: current, status, mode: input.mode,
      autoAmount: input.autoAmount, createdAt: row!.created_at, lastRunAt: row!.created_at,
      history: current > 0 ? [{ id: crypto.randomUUID(), at: new Date().toISOString(), amount: current, type: "deposit" }] : [],
    };
    setGoals((prev) => [goal, ...prev]);

    await insertTx(user.id, { type: "goal-created", amount: input.target, note: `Goal created: ${goal.name}`, metadata: { goal_id: goal.id } });
    pushTx(user, { type: "goal-created", amount: input.target, status: "completed", note: `Goal created: ${goal.name}`, goalId: goal.id });
    if (status === "completed") {
      await insertTx(user.id, { type: "goal-completed", amount: current, note: `Goal completed: ${goal.name}`, metadata: { goal_id: goal.id } });
      pushTx(user, { type: "goal-completed", amount: current, status: "completed", note: `Goal completed: ${goal.name}`, goalId: goal.id });
      pushNotif(user, { title: "Savings goal completed", message: `${goal.name} funded fully.` });
    }
    return goal;
  };

  const fundGoal: Ctx["fundGoal"] = async (id, amount) => {
    if (!user) throw new Error("Not signed in");
    if (amount <= 0) throw new Error("Enter a valid amount");
    if (user.balances.main < amount) throw new Error("Insufficient main balance");
    const g = goals.find((x) => x.id === id);
    if (!g) throw new Error("Goal not found");
    if (g.status === "completed" || g.status === "cancelled") throw new Error("Goal not active");

    const add = Math.min(amount, g.target - g.saved);
    const nextBalances = { ...user.balances, main: user.balances.main - add, savings: user.balances.savings + add };
    await updateBalances(user.id, nextBalances);
    setUser({ ...user, balances: nextBalances });

    const newSaved = g.saved + add;
    const newStatus = newSaved >= g.target ? "completed" : g.status;
    await supabase.from("goals").update({ current: newSaved, status: newStatus }).eq("id", id);

    setGoals((prev) => prev.map((x) => x.id === id ? {
      ...x, saved: newSaved, status: newStatus,
      history: [{ id: crypto.randomUUID(), at: new Date().toISOString(), amount: add, type: "deposit" }, ...x.history],
    } : x));

    await insertTx(user.id, { type: "savings-deposit", amount: add, category: "main->savings", note: `Funded goal: ${g.name}`, metadata: { goal_id: id } });
    pushTx(user, { type: "savings-deposit", amount: add, from: "main", to: "savings", status: "completed", note: `Funded goal: ${g.name}`, goalId: id });
    if (newStatus === "completed") {
      await insertTx(user.id, { type: "goal-completed", amount: newSaved, note: `Goal completed: ${g.name}`, metadata: { goal_id: id } });
      pushTx(user, { type: "goal-completed", amount: newSaved, status: "completed", note: `Goal completed: ${g.name}`, goalId: id });
      pushNotif(user, { title: "Savings goal completed", message: `${g.name} reached its target.` });
    }
  };

  const withdrawGoal: Ctx["withdrawGoal"] = async (id, amount) => {
    if (!user) throw new Error("Not signed in");
    if (amount <= 0) throw new Error("Enter a valid amount");
    const g = goals.find((x) => x.id === id);
    if (!g) throw new Error("Goal not found");
    if (amount > g.saved) throw new Error("Insufficient saved amount");

    const nextBalances = { ...user.balances, main: user.balances.main + amount, savings: Math.max(0, user.balances.savings - amount) };
    await updateBalances(user.id, nextBalances);
    setUser({ ...user, balances: nextBalances });

    const newSaved = g.saved - amount;
    const newStatus = g.status === "completed" && newSaved < g.target ? "active" : g.status;
    await supabase.from("goals").update({ current: newSaved, status: newStatus }).eq("id", id);

    setGoals((prev) => prev.map((x) => x.id === id ? {
      ...x, saved: newSaved, status: newStatus,
      history: [{ id: crypto.randomUUID(), at: new Date().toISOString(), amount, type: "withdraw" }, ...x.history],
    } : x));

    await insertTx(user.id, { type: "savings-withdraw", amount, category: "savings->main", note: `Withdrew from goal: ${g.name}`, metadata: { goal_id: id } });
    pushTx(user, { type: "savings-withdraw", amount, from: "savings", to: "main", status: "completed", note: `Withdrew from goal: ${g.name}`, goalId: id });
  };

  const editGoal: Ctx["editGoal"] = async (id, patch) => {
    if (!user) throw new Error("Not signed in");
    const supaPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) supaPatch.name = patch.name;
    if (patch.target !== undefined) supaPatch.target = patch.target;
    if (patch.status !== undefined) supaPatch.status = patch.status;
    await supabase.from("goals").update(supaPatch).eq("id", id);
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };
  const pauseGoal: Ctx["pauseGoal"] = async (id) => editGoal(id, { status: "paused" });
  const resumeGoal: Ctx["resumeGoal"] = async (id) => editGoal(id, { status: "active" });
  const deleteGoal: Ctx["deleteGoal"] = async (id) => {
    if (!user) throw new Error("Not signed in");
    const g = goals.find((x) => x.id === id);
    if (g && g.saved > 0) {
      const nextBalances = { ...user.balances, main: user.balances.main + g.saved, savings: Math.max(0, user.balances.savings - g.saved) };
      await updateBalances(user.id, nextBalances);
      setUser({ ...user, balances: nextBalances });
      await insertTx(user.id, { type: "savings-withdraw", amount: g.saved, note: `Goal deleted, returned to main: ${g.name}`, metadata: { goal_id: id } });
      pushTx(user, { type: "savings-withdraw", amount: g.saved, from: "savings", to: "main", status: "completed", note: `Goal deleted, returned to main: ${g.name}`, goalId: id });
    }
    await supabase.from("goals").delete().eq("id", id);
    setGoals((prev) => prev.filter((x) => x.id !== id));
  };

  const submitLoan: Ctx["submitLoan"] = async (input) => {
    if (!user) throw new Error("Not signed in");
    if (loans.some((l) => ["submitted", "under-review", "approved"].includes(l.status))) {
      throw new Error("You already have a pending loan application");
    }
    if (input.docs.ids.length < 2) throw new Error("Upload at least two identity documents");
    if (input.docs.income.length < 1) throw new Error("Upload at least one income document");
    if (input.docs.address.length < 1) throw new Error("Upload at least one address document");
    if (!input.bank.name || !input.bank.account) throw new Error("Bank details required");

    const apr = 12;
    const r = apr / 100 / 12;
    const monthlyPayment = +((input.amount * r) / (1 - Math.pow(1 + r, -input.termMonths))).toFixed(2);

    const { data: row } = await supabase
      .from("loans")
      .insert({
        user_id: user.id, amount_requested: input.amount, term_months: input.termMonths,
        purpose: input.purpose, status: "submitted",
        metadata: { apr, monthlyPayment, remaining: input.amount, personal: input.personal, finances: input.finances, docs: input.docs, bank: input.bank, payments: [] },
      })
      .select()
      .maybeSingle();

    const loan: Loan = {
      id: row!.id, amount: input.amount, purpose: input.purpose, termMonths: input.termMonths,
      apr, status: "submitted", submittedAt: row!.created_at, remaining: input.amount,
      monthlyPayment, payments: [], personal: input.personal, finances: input.finances,
      docs: input.docs, bank: input.bank,
    };
    setLoans((prev) => [loan, ...prev]);

    await insertTx(user.id, { type: "loan-submitted", amount: input.amount, note: `Loan application — $${input.amount}`, metadata: { loan_id: loan.id } });
    pushTx(user, { type: "loan-submitted", amount: input.amount, status: "pending", note: `Loan application — $${input.amount}`, loanId: loan.id });
    await supabase.from("notifications").insert({ user_id: user.id, title: "Loan application received", body: "We're reviewing your submission." });
    pushNotif(user, { title: "Loan application received", message: "We're reviewing your submission." });
    return loan;
  };

  const repayLoan: Ctx["repayLoan"] = async (id, amount) => {
    if (!user) throw new Error("Not signed in");
    if (amount <= 0) throw new Error("Enter a valid amount");
    if (user.balances.main < amount) throw new Error("Insufficient main balance");
    const l = loans.find((x) => x.id === id);
    if (!l || l.status !== "disbursed") throw new Error("Loan not active");

    const pay = Math.min(amount, l.remaining);
    const nextBalances = { ...user.balances, main: user.balances.main - pay };
    await updateBalances(user.id, nextBalances);
    setUser({ ...user, balances: nextBalances });

    const nextRemaining = +(l.remaining - pay).toFixed(2);
    const nextStatus: LoanStatus = nextRemaining <= 0 ? "closed" : l.status;
    const payments = [{ at: new Date().toISOString(), amount: pay }, ...l.payments];
    await supabase.from("loans").update({
      status: nextStatus,
      metadata: { apr: l.apr, monthlyPayment: l.monthlyPayment, remaining: nextRemaining, payments, personal: l.personal, finances: l.finances, docs: l.docs, bank: l.bank },
    }).eq("id", id);

    setLoans((prev) => prev.map((x) => x.id === id ? { ...x, remaining: nextRemaining, status: nextStatus, payments } : x));

    await insertTx(user.id, { type: "loan-payment", amount: pay, note: `Loan payment${nextStatus === "closed" ? " (paid off)" : ""}`, metadata: { loan_id: id } });
    pushTx(user, { type: "loan-payment", amount: pay, from: "main", status: "completed", note: `Loan payment${nextStatus === "closed" ? " (paid off)" : ""}`, loanId: id });
    await supabase.from("notifications").insert({ user_id: user.id, title: "Payment received", body: `$${pay.toFixed(2)} applied to your loan.` });
    pushNotif(user, { title: "Payment received", message: `$${pay.toFixed(2)} applied to your loan.` });
  };

  const payoffLoan: Ctx["payoffLoan"] = async (id) => {
    const l = loans.find((x) => x.id === id);
    if (!l) throw new Error("Loan not found");
    return repayLoan(id, l.remaining);
  };

  const value = useMemo<Ctx>(
    () => ({
      user,
      ready,
      txs,
      vaults,
      notifs,
      trades,
      goals,
      loans,
      theme,
      toggleTheme,
      login,
      register,
      logout,
      internalTransfer,
      sendToUser,
      externalSend,
      deposit,
      requestLoan,
      buyVault,
      storePurchase,
      markAllNotifsRead,
      addFundsToInvest,
      moveInvestToMain,
      openTrade,
      closeTrade,
      createGoal,
      fundGoal,
      withdrawGoal,
      editGoal,
      pauseGoal,
      resumeGoal,
      deleteGoal,
      submitLoan,
      repayLoan,
      payoffLoan,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, ready, txs, vaults, notifs, trades, goals, loans, theme],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}