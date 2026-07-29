import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
export const Route = createFileRoute("/cookies")({ component: () => (
  <LegalPage title="Cookie Policy" intro="What cookies we use and why." sections={[
    { h: "Essential cookies", p: "Required to authenticate your session." },
    { h: "Analytics cookies", p: "Aggregated usage to improve the product." },
    { h: "Managing preferences", p: "Update your choices from the cookie banner." },
  ]} />
) });