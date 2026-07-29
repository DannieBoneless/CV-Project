/**
 * AppContext — the single source of truth for auth, wallet, investments,
 * transactions, notifications and theme. Backed by localStorage today.
 *
 * Architecture note (future Supabase swap):
 * - All mutations are async and return Promises.
 * - No mutation runs on a background timer; every balance/tx change is the
 *   result of an explicit user action (or, in the future, an admin action
 *   performed server-side).
 * - Persistence is isolated to the persist* helpers below. Swapping to
 *   Supabase means replacing those helpers + login/register with SDK calls
 *   and subscribing to Realtime — the UI does not need to change.
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
  id: string; // = email
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
          setTxs(ls(K.tx(u.id), []));
          setVaults(ls(K.vaults(u.id), []));
          setNotifs(ls(K.notifs(u.id), []));
          setTrades(ls(K.trades(u.id), []));
          setGoals(ls(K.goals(u.id), []));
          setLoans(ls(K.loans(u.id), []));
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

  const persistUser = useCallback((u: User) => {
    const all = loadUsers();
    all[u.id] = u;
    saveUsers(all);
    setUser({ ...u });
  }, []);

  const persistTx = useCallback((id: string, next: Tx[]) => {
    localStorage.setItem(K.tx(id), JSON.stringify(next));
    setTxs(next);
  }, []);
  const persistVaults = useCallback((id: string, next: Vault[]) => {
    localStorage.setItem(K.vaults(id), JSON.stringify(next));
    setVaults(next);
  }, []);
  const persistNotifs = useCallback((id: string, next: Notif[]) => {
    localStorage.setItem(K.notifs(id), JSON.stringify(next));
    setNotifs(next);
  }, []);
  const persistTrades = useCallback((id: string, next: Trade[]) => {
    localStorage.setItem(K.trades(id), JSON.stringify(next));
    setTrades(next);
  }, []);
  const persistGoals = useCallback((id: string, next: Goal[]) => {
    localStorage.setItem(K.goals(id), JSON.stringify(next));
    setGoals(next);
  }, []);
  const persistLoans = useCallback((id: string, next: Loan[]) => {
    localStorage.setItem(K.loans(id), JSON.stringify(next));
    setLoans(next);
  }, []);

  const shortRef = () => "CV-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const pushTx = (u: User, tx: Omit<Tx, "id" | "at" | "ref"> & { ref?: string }) => {
    const entry: Tx = {
      ...tx,
      ref: tx.ref ?? shortRef(),
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    };
    const next = [entry, ...ls<Tx[]>(K.tx(u.id), [])];
    persistTx(u.id, next);
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
    setTxs(ls(K.tx(u.id), []));
    setVaults(ls(K.vaults(u.id), []));
    setNotifs(ls(K.notifs(u.id), []));
    setTrades(ls(K.trades(u.id), []));
    setGoals(ls(K.goals(u.id), []));
    setLoans(ls(K.loans(u.id), []));
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
    const next: User = {
      ...user,
      balances: {
        ...user.balances,
        [from]: user.balances[from] - amount,
        [to]: user.balances[to] + amount,
      },
    };
    persistUser(next);
    pushTx(next, { type: "transfer", amount, from, to, status: "completed", note: `Internal ${from} → ${to}` });
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
    // Record as pending; a future admin/backend flow will finalize.
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
    pushTx(user, {
      type: "deposit",
      amount,
      to: "main",
      status: "pending",
      note: `${method} deposit — pending verification`,
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

  const markAllNotifsRead = () => {
    if (!user) return;
    const next = notifs.map((n) => ({ ...n, read: true }));
    persistNotifs(user.id, next);
  };

  const addFundsToInvest: Ctx["addFundsToInvest"] = async (amount) => {
    if (!user) throw new Error("Not signed in");
    if (user.balances.main < amount) throw new Error("Insufficient main balance");
    const next: User = {
      ...user,
      balances: {
        ...user.balances,
        main: user.balances.main - amount,
        investment: user.balances.investment + amount,
      },
    };
    persistUser(next);
    pushTx(next, { type: "invest-transfer", amount, from: "main", to: "investment", status: "completed", note: "Main → Investment" });
  };

  const moveInvestToMain: Ctx["moveInvestToMain"] = async (amount) => {
    if (!user) throw new Error("Not signed in");
    if (amount <= 0) throw new Error("Enter a valid amount");
    if (user.balances.investment < amount) throw new Error("Insufficient investment balance");
    const next: User = {
      ...user,
      balances: {
        ...user.balances,
        investment: user.balances.investment - amount,
        main: user.balances.main + amount,
      },
    };
    persistUser(next);
    pushTx(next, { type: "invest-transfer", amount, from: "investment", to: "main", status: "completed", note: "Investment → Main" });
  };

  const openTrade: Ctx["openTrade"] = async ({ sym, name, side, qty, price }) => {
    if (!user) throw new Error("Not signed in");
    if (qty <= 0) throw new Error("Quantity must be greater than 0");
    const cost = qty * price;
    if (user.balances.investment < cost) throw new Error("Insufficient investment cash. Move funds from Main first.");
    const next: User = {
      ...user,
      balances: { ...user.balances, investment: user.balances.investment - cost },
    };
    persistUser(next);
    const t: Trade = {
      id: crypto.randomUUID(), sym, name, side, qty, openPrice: price,
      openAt: new Date().toISOString(), status: "open",
    };
    persistTrades(next.id, [t, ...ls<Trade[]>(K.trades(next.id), [])]);
    pushTx(next, { type: "trade-open", amount: cost, from: "investment", status: "completed", note: `${side.toUpperCase()} ${qty} ${sym} @ $${price.toFixed(2)}`, tradeId: t.id });
  };

  const closeTrade: Ctx["closeTrade"] = async (id, currentPrice) => {
    if (!user) throw new Error("Not signed in");
    const all = ls<Trade[]>(K.trades(user.id), []);
    const t = all.find((x) => x.id === id);
    if (!t || t.status !== "open") throw new Error("Trade not found");
    const gross = t.qty * currentPrice;
    const cost = t.qty * t.openPrice;
    const rawPnl = gross - cost;
    // Buy: profit when price rose. Sell (short): profit when price fell.
    const pnl = t.side === "buy" ? rawPnl : -rawPnl;
    const pnlPct = (pnl / cost) * 100;
    const proceeds = cost + pnl; // return principal + realized pnl to investment cash
    const closed: Trade = {
      ...t, status: "closed", closePrice: currentPrice,
      closeAt: new Date().toISOString(), pnl, pnlPct,
    };
    const nextTrades = all.map((x) => (x.id === id ? closed : x));
    const nextUser: User = {
      ...user,
      balances: { ...user.balances, investment: user.balances.investment + Math.max(0, proceeds) },
    };
    persistUser(nextUser);
    persistTrades(nextUser.id, nextTrades);
    pushTx(nextUser, {
      type: "trade-close", amount: Math.abs(pnl),
      to: "investment",
      status: pnl >= 0 ? "completed" : "failed",
      note: `Closed ${t.side.toUpperCase()} ${t.qty} ${t.sym} · ${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)} (${pnlPct.toFixed(2)}%)`,
      tradeId: t.id,
    });
    pushNotif(nextUser, {
      title: pnl >= 0 ? "Trade closed — profit" : "Trade closed — loss",
      message: `${t.sym}: ${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)} (${pnlPct.toFixed(2)}%)`,
    });
  };

  const createGoal: Ctx["createGoal"] = async (input) => {
    if (!user) throw new Error("Not signed in");
    if (!input.name.trim()) throw new Error("Give your goal a name");
    if (input.target <= 0) throw new Error("Target must be greater than 0");
    const goal: Goal = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      target: input.target,
      dueDate: input.dueDate,
      description: input.description,
      mode: input.mode,
      autoAmount: input.autoAmount,
      saved: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      lastRunAt: new Date().toISOString(),
      history: [],
    };
    let nextUser = user;
    let nextGoal = goal;
    if (input.mode === "one-time") {
      if (user.balances.main < input.target) throw new Error("Insufficient main balance for one-time deposit");
      nextUser = { ...user, balances: { ...user.balances, main: user.balances.main - input.target } };
      nextGoal = {
        ...goal, saved: input.target, status: "completed",
        history: [{ id: crypto.randomUUID(), at: new Date().toISOString(), amount: input.target, type: "deposit" }],
      };
    } else if (input.initialDeposit && input.initialDeposit > 0) {
      if (user.balances.main < input.initialDeposit) throw new Error("Insufficient main balance");
      nextUser = { ...user, balances: { ...user.balances, main: user.balances.main - input.initialDeposit, savings: user.balances.savings + input.initialDeposit } };
      nextGoal = {
        ...goal, saved: input.initialDeposit,
        history: [{ id: crypto.randomUUID(), at: new Date().toISOString(), amount: input.initialDeposit, type: "deposit" }],
      };
    }
    if (input.mode !== "one-time") {
      nextUser = { ...nextUser, balances: { ...nextUser.balances, savings: nextUser.balances.savings + (nextGoal.saved - goal.saved) } };
    }
    persistUser(nextUser);
    persistGoals(nextUser.id, [nextGoal, ...ls<Goal[]>(K.goals(nextUser.id), [])]);
    pushTx(nextUser, { type: "goal-created", amount: input.target, status: "completed", note: `Goal created: ${goal.name}`, goalId: goal.id });
    if (nextGoal.status === "completed") {
      pushTx(nextUser, { type: "goal-completed", amount: nextGoal.saved, status: "completed", note: `Goal completed: ${goal.name}`, goalId: goal.id });
      pushNotif(nextUser, { title: "Savings goal completed", message: `${goal.name} funded fully.` });
    }
    return nextGoal;
  };

  const fundGoal: Ctx["fundGoal"] = async (id, amount) => {
    if (!user) throw new Error("Not signed in");
    if (amount <= 0) throw new Error("Enter a valid amount");
    if (user.balances.main < amount) throw new Error("Insufficient main balance");
    const all = ls<Goal[]>(K.goals(user.id), []);
    const g = all.find((x) => x.id === id);
    if (!g) throw new Error("Goal not found");
    if (g.status === "completed" || g.status === "cancelled") throw new Error("Goal not active");
    const add = Math.min(amount, g.target - g.saved);
    const nextUser: User = {
      ...user,
      balances: { ...user.balances, main: user.balances.main - add, savings: user.balances.savings + add },
    };
    const updated: Goal = {
      ...g,
      saved: g.saved + add,
      status: g.saved + add >= g.target ? "completed" : g.status,
      history: [{ id: crypto.randomUUID(), at: new Date().toISOString(), amount: add, type: "deposit" }, ...g.history],
    };
    persistUser(nextUser);
    persistGoals(nextUser.id, all.map((x) => (x.id === id ? updated : x)));
    pushTx(nextUser, { type: "savings-deposit", amount: add, from: "main", to: "savings", status: "completed", note: `Funded goal: ${g.name}`, goalId: g.id });
    if (updated.status === "completed") {
      pushTx(nextUser, { type: "goal-completed", amount: updated.saved, status: "completed", note: `Goal completed: ${g.name}`, goalId: g.id });
      pushNotif(nextUser, { title: "Savings goal completed", message: `${g.name} reached its target.` });
    }
  };

  const withdrawGoal: Ctx["withdrawGoal"] = async (id, amount) => {
    if (!user) throw new Error("Not signed in");
    if (amount <= 0) throw new Error("Enter a valid amount");
    const all = ls<Goal[]>(K.goals(user.id), []);
    const g = all.find((x) => x.id === id);
    if (!g) throw new Error("Goal not found");
    if (amount > g.saved) throw new Error("Insufficient saved amount");
    const nextUser: User = {
      ...user,
      balances: { ...user.balances, main: user.balances.main + amount, savings: Math.max(0, user.balances.savings - amount) },
    };
    const updated: Goal = {
      ...g,
      saved: g.saved - amount,
      status: g.status === "completed" && g.saved - amount < g.target ? "active" : g.status,
      history: [{ id: crypto.randomUUID(), at: new Date().toISOString(), amount, type: "withdraw" }, ...g.history],
    };
    persistUser(nextUser);
    persistGoals(nextUser.id, all.map((x) => (x.id === id ? updated : x)));
    pushTx(nextUser, { type: "savings-withdraw", amount, from: "savings", to: "main", status: "completed", note: `Withdrew from goal: ${g.name}`, goalId: g.id });
  };

  const editGoal: Ctx["editGoal"] = async (id, patch) => {
    if (!user) throw new Error("Not signed in");
    const all = ls<Goal[]>(K.goals(user.id), []);
    const next = all.map((g) => (g.id === id ? { ...g, ...patch } : g));
    persistGoals(user.id, next);
  };
  const pauseGoal: Ctx["pauseGoal"] = async (id) => editGoal(id, { status: "paused" });
  const resumeGoal: Ctx["resumeGoal"] = async (id) => editGoal(id, { status: "active" });
  const deleteGoal: Ctx["deleteGoal"] = async (id) => {
    if (!user) throw new Error("Not signed in");
    const all = ls<Goal[]>(K.goals(user.id), []);
    const g = all.find((x) => x.id === id);
    if (g && g.saved > 0) {
      // Return remaining to main
      const nextUser: User = {
        ...user,
        balances: { ...user.balances, main: user.balances.main + g.saved, savings: Math.max(0, user.balances.savings - g.saved) },
      };
      persistUser(nextUser);
      pushTx(nextUser, { type: "savings-withdraw", amount: g.saved, from: "savings", to: "main", status: "completed", note: `Goal deleted, returned to main: ${g.name}`, goalId: g.id });
    }
    persistGoals(user.id, all.filter((x) => x.id !== id));
  };

  // Note: automatic-cadence savings (daily/weekly/monthly) will be executed by
  // a server-side scheduler once Supabase is connected. No client-side timer.

  const submitLoan: Ctx["submitLoan"] = async (input) => {
    if (!user) throw new Error("Not signed in");
    const existing = ls<Loan[]>(K.loans(user.id), []);
    if (existing.some((l) => ["submitted", "under-review", "approved"].includes(l.status))) {
      throw new Error("You already have a pending loan application");
    }
    if (input.docs.ids.length < 2) throw new Error("Upload at least two identity documents");
    if (input.docs.income.length < 1) throw new Error("Upload at least one income document");
    if (input.docs.address.length < 1) throw new Error("Upload at least one address document");
    if (!input.bank.name || !input.bank.account) throw new Error("Bank details required");
    const apr = 12;
    const r = apr / 100 / 12;
    const monthlyPayment = +((input.amount * r) / (1 - Math.pow(1 + r, -input.termMonths))).toFixed(2);
    const loan: Loan = {
      id: crypto.randomUUID(),
      amount: input.amount,
      purpose: input.purpose,
      termMonths: input.termMonths,
      apr,
      status: "submitted",
      submittedAt: new Date().toISOString(),
      remaining: input.amount,
      monthlyPayment,
      payments: [],
      personal: input.personal,
      finances: input.finances,
      docs: input.docs,
      bank: input.bank,
    };
    persistLoans(user.id, [loan, ...existing]);
    pushTx(user, { type: "loan-submitted", amount: input.amount, status: "pending", note: `Loan application — $${input.amount}`, loanId: loan.id });
    pushNotif(user, { title: "Loan application received", message: "We're reviewing your submission." });
    // Review, approval, and disbursement are performed by admin/backend once
    // Supabase is connected. Client leaves the loan as "submitted".
    return loan;
  };

  const repayLoan: Ctx["repayLoan"] = async (id, amount) => {
    if (!user) throw new Error("Not signed in");
    if (amount <= 0) throw new Error("Enter a valid amount");
    if (user.balances.main < amount) throw new Error("Insufficient main balance");
    const all = ls<Loan[]>(K.loans(user.id), []);
    const l = all.find((x) => x.id === id);
    if (!l || l.status !== "disbursed") throw new Error("Loan not active");
    const pay = Math.min(amount, l.remaining);
    const nextUser: User = { ...user, balances: { ...user.balances, main: user.balances.main - pay } };
    const next = new Date(); next.setMonth(next.getMonth() + 1);
    const updated: Loan = {
      ...l,
      remaining: +(l.remaining - pay).toFixed(2),
      payments: [{ at: new Date().toISOString(), amount: pay }, ...l.payments],
      nextPaymentAt: l.remaining - pay <= 0 ? undefined : next.toISOString(),
      status: l.remaining - pay <= 0 ? "closed" : l.status,
    };
    persistUser(nextUser);
    persistLoans(nextUser.id, all.map((x) => (x.id === id ? updated : x)));
    pushTx(nextUser, { type: "loan-payment", amount: pay, from: "main", status: "completed", note: `Loan payment${updated.status === "closed" ? " (paid off)" : ""}`, loanId: l.id });
    pushNotif(nextUser, { title: "Payment received", message: `$${pay.toFixed(2)} applied to your loan.` });
  };

  const payoffLoan: Ctx["payoffLoan"] = async (id) => {
    if (!user) throw new Error("Not signed in");
    const l = ls<Loan[]>(K.loans(user.id), []).find((x) => x.id === id);
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