import { MarketingShell } from "./marketing-shell";

export function LegalPage({ title, intro, sections }: {
  title: string;
  intro: string;
  sections: { h: string; p: string }[];
}) {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-4 py-16 animate-fade-up">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 text-muted-foreground">{intro}</p>
        <div className="mt-8 space-y-6">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold">{s.h}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}