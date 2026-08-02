import { useEffect } from "react";

export function TawkChat() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).Tawk_API) return; // avoid double-loading

    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = "https://embed.tawk.to/6a6f6d542539311d47e44dc6/1jv1k64oi";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    s0.parentNode?.insertBefore(s1, s0);
  }, []);

  return null;
}
