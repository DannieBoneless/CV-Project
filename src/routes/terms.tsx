import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
export const Route = createFileRoute("/terms")({ component: () => (
  <LegalPage title="Terms of Service" intro="The agreement between you and CrestVest Inc." sections={[
    { h: "Eligibility", p: "You must be 18+." },
    { h: "Acceptable use", p: "No unlawful activity." },
    { h: "Fees", p: "Standard accounts have zero monthly fees." },
    { h: "Termination", p: "Either party may terminate per notice provisions." },
  ]} />
) });