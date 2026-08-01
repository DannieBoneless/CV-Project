import { useEffect } from "react";

const SMARTSUPP_KEY = "652db115f801c4e51d2576da9c8e6c090345a646";

export function SmartsuppChat() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any)._smartsupp) return; // avoid double-loading

    (window as any)._smartsupp = (window as any)._smartsupp || {};
    (window as any)._smartsupp.key = SMARTSUPP_KEY;

    (function (d: Document) {
      const s = d.getElementsByTagName("script")[0];
      const c = d.createElement("script");
      c.type = "text/javascript";
      c.charset = "utf-8";
      c.async = true;
      c.src = "https://www.smartsuppchat.com/loader.js?";
      s.parentNode?.insertBefore(c, s);
    })(document);
  }, []);

  return null;
}
