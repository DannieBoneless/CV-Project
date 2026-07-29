import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
export const Route = createFileRoute("/privacy")({ component: () => (
  <LegalPage title="Privacy Policy" intro="How we collect, use, and safeguard your information." sections={[
    { h: "Information we collect", p: "Account, transaction, and device information required to operate the service." },
    { h: "How we use it", p: "To provide the service, prevent fraud, and comply with regulations." },
    { h: "Data sharing", p: "We never sell your personal data." },
    { h: "Your rights", p: "Access, correction, deletion, and portability rights are available in Settings." },
  ]} />
) });