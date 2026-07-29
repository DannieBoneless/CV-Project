import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./logo";
import { useApp } from "@/context/app-context";
import {
  ArrowLeft, LayoutDashboard, ArrowLeftRight, PiggyBank, TrendingUp,
  CreditCard, ReceiptText, BarChart3, Bell, Settings as SettingsIcon,
  LifeBuoy, ShoppingBag, Landmark, LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invest", label: "Investments", icon: TrendingUp },
  { to: "/transfer", label: "Transfers", icon: ArrowLeftRight },
  { to: "/savings", label: "Savings", icon: PiggyBank },
  { to: "/cards", label: "Cards", icon: CreditCard },
  { to: "/loans", label: "Loans", icon: Landmark },
  { to: "/store", label: "Store", icon: ShoppingBag },
  { to: "/transactions", label: "Transactions", icon: ReceiptText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function DashboardShell({ children, title }: { children: ReactNode; title?: string }) {
  const { user, logout, ready } = useApp();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) nav({ to: "/auth" });
  }, [ready, user, nav]);

  useEffect(() => { setDrawerOpen(false); }, [path]);

  if (!ready || !user) return null;
  const doLogout = () => { logout(); nav({ to: "/" }); };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 glass border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 hover:bg-muted md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" aria-label="Home"><Logo withWord={false} /></Link>
            <Link to="/" className="hidden items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted sm:inline-flex">
              <ArrowLeft className="h-3 w-3" /> Home
            </Link>
            {title && <span className="hidden text-sm font-medium md:inline">{title}</span>}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="rounded-lg p-2 hover:bg-muted"><Bell className="h-4 w-4" /></Link>
            <div className="hidden text-right text-xs md:block">
              <div className="font-medium">{user.firstName} {user.lastName}</div>
              <div className="text-muted-foreground">{user.email}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary font-semibold text-primary-foreground">
              {(user.firstName?.[0] || user.email[0]).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-fade-up"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto border-r border-border bg-background shadow-elegant">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 p-3">
              {NAV.map((n) => {
                const active = path === n.to;
                const I = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "gradient-primary text-primary-foreground shadow-elegant" : "hover:bg-muted"}`}
                  >
                    <I className="h-4 w-4" /> {n.label}
                  </Link>
                );
              })}
              <div className="mt-4 rounded-lg border border-border p-3">
                <div className="truncate text-xs text-muted-foreground">Signed in as</div>
                <div className="truncate text-sm font-medium" title={user.email}>{user.email}</div>
                <button onClick={doLogout} className="mt-2 flex w-full items-center gap-2 rounded-md bg-muted px-2 py-1.5 text-xs hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-3 w-3" /> Sign out
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-20 space-y-1">
            {NAV.map((n) => {
              const active = path === n.to;
              const I = n.icon;
              return (
                <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "gradient-primary text-primary-foreground shadow-elegant" : "hover:bg-muted"}`}>
                  <I className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
            <div className="mt-4 rounded-lg border border-border p-3">
              <div className="truncate text-xs text-muted-foreground">Signed in as</div>
              <div className="truncate text-sm font-medium" title={user.email}>{user.email}</div>
              <button onClick={doLogout} className="mt-2 flex w-full items-center gap-2 rounded-md bg-muted px-2 py-1.5 text-xs hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-3 w-3" /> Sign out
              </button>
            </div>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 animate-fade-up pb-16 md:pb-0">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t glass py-1 md:hidden">
        {[NAV[0], NAV[1], NAV[2], NAV[4], NAV[11]].map((n) => {
          const I = n.icon;
          const active = path === n.to;
          return (
            <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-0.5 py-1 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <I className="h-5 w-5" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}