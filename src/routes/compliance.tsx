import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
export const Route = createFileRoute("/compliance")({ component: () => (
  <LegalPage title="Compliance" intro="Our commitment to regulatory obligations." sections={[
    { h: "Licensing", p: "FDIC insured through partner banks; operates under US state money-transmitter licenses." },
    { h: "KYC / AML", p: "We verify every customer and monitor for financial crime." },
    { h: "Reporting", p: "We file required reports with FinCEN." },
  ]} />
) });