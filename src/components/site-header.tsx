import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import { useApp } from "@/context/app-context";
import { Moon, Sun } from "lucide-react";

export function SiteHeader() {
  const { user, theme, toggleTheme } = useApp();
  return (
    <header className="sticky top-0 z-30 glass border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4">
        <Link to="/" className="flex min-w-0 shrink items-center gap-2"><Logo /></Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link to="/features" className="hover:text-primary">Features</Link>
          <Link to="/investments" className="hover:text-primary">Invest</Link>
          <Link to="/cards" className="hover:text-primary">Cards</Link>
          <Link to="/about" className="hover:text-primary">About</Link>
          <Link to="/contact" className="hover:text-primary">Contact</Link>
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button aria-label="Toggle theme" onClick={toggleTheme} className="rounded-lg p-2 hover:bg-muted">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <Link to="/dashboard" className="rounded-lg gradient-primary px-3 py-2 text-sm font-medium text-primary-foreground sm:px-4">Dashboard</Link>
          ) : (
            <>
              <Link to="/auth" className="hidden rounded-lg px-3 py-2 text-sm sm:inline-flex">Sign in</Link>
              <Link to="/auth" className="rounded-lg gradient-primary px-3 py-2 text-sm font-medium text-primary-foreground sm:px-4">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}