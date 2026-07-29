import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import { Facebook, Instagram, Twitter, Music2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              CrestVest Inc. — the premium digital banking platform built for the modern global economy.
            </p>
          </div>
          <FooterCol title="Product" links={[["Features","/features"],["Cards","/cards"],["Investments","/investments"],["Savings","/savings"],["Transfers","/transfers"]]} />
          <FooterCol title="Company" links={[["About Us","/about"],["Careers","/careers"],["Press","/press"],["Blog","/blog"],["Contact","/contact"]]} />
          <FooterCol title="Legal" links={[["Privacy Policy","/privacy"],["Terms of Service","/terms"],["Cookie Policy","/cookies"],["Compliance","/compliance"]]} />
        </div>
        <div className="mt-10 flex items-center justify-center gap-4">
          {[
            { i: Facebook, label: "Facebook", href: "https://facebook.com/" },
            { i: Twitter, label: "Twitter / X", href: "https://x.com/" },
            { i: Instagram, label: "Instagram", href: "https://instagram.com/" },
            { i: Music2, label: "TikTok", href: "https://tiktok.com/" },
          ].map(({ i: I, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              <I className="h-4 w-4" />
            </a>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 opacity-60">
          {["VISA","Mastercard","Plaid","Stripe","Zelle","SWIFT"].map((p) => (
            <span key={p} className="text-sm font-semibold tracking-widest">{p}</span>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © 2025 CrestVest Inc. All rights reserved. Funds insured up to $250,000 · FDIC Member · Equal Housing Lender
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}><Link to={href} className="hover:text-primary">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}