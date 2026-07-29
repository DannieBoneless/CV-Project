import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("cv.cookie")) return;
    const t = setTimeout(() => setShow(true), 10_000);
    return () => clearTimeout(t);
  }, []);
  const decide = (v: "accept" | "decline") => {
    localStorage.setItem("cv.cookie", v);
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 rounded-2xl glass p-4 shadow-elegant animate-slide-up md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md">
      <h3 className="font-semibold">We value your privacy</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We use cookies to enhance your experience, analyze traffic, and personalize content.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => decide("accept")} className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Accept
        </button>
        <button onClick={() => decide("decline")} className="rounded-lg border border-border px-4 py-2 text-sm font-medium">
          Decline
        </button>
        <Link to="/cookies" className="rounded-lg px-4 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline">
          Learn more
        </Link>
      </div>
    </div>
  );
}