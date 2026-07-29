import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

type T = { name: string; role: string; quote: string; rating: number };

const ALL: T[] = [
  { name: "Priya Ramanathan", role: "Product Designer, NYC", rating: 5, quote: "Finally a bank that treats investing like a first-class citizen. Clean, fast, honest." },
  { name: "Marcus Levine", role: "Founder, Levine & Co.", rating: 5, quote: "Sent $2,000 abroad and it arrived in 8 seconds. My old bank could never." },
  { name: "Sofia Delgado", role: "Physician, Miami", rating: 5, quote: "The Legend Vault paid out exactly what they promised. 12% APY, on the dot." },
  { name: "Jordan Blake", role: "Software Engineer", rating: 5, quote: "The card design alone is worth it. And the analytics view is genuinely useful." },
  { name: "Amelia Chen", role: "Marketing Lead", rating: 4, quote: "Support answered in under a minute on a Saturday. That never happens." },
  { name: "Kwame Osei", role: "Real-estate Investor", rating: 5, quote: "I run three properties through CrestVest. Cash management has never been easier." },
  { name: "Isabella Rossi", role: "Freelance Photographer", rating: 5, quote: "Getting paid in four currencies used to be a nightmare. Now it's automatic." },
  { name: "Devon Park", role: "Grad Student", rating: 4, quote: "Zero fees, and the savings goals actually got me to hit my emergency fund target." },
  { name: "Naledi Mokoena", role: "Attorney, Johannesburg", rating: 5, quote: "Feels like a private bank, priced like a consumer app. Bizarre in the best way." },
  { name: "Ethan Whitaker", role: "Retired Engineer", rating: 5, quote: "Charts are clear, statements are clean, and my grandkids can help me use it." },
  { name: "Layla Haddad", role: "Small Business Owner", rating: 5, quote: "Cash flow, invoicing, and vaults in one place. I let my old business bank go." },
  { name: "Ryan O'Connor", role: "Contractor", rating: 4, quote: "The virtual card for subs saved me hours of reconciliation each month." },
  { name: "Hana Kobayashi", role: "UX Researcher, Tokyo", rating: 5, quote: "Beautifully considered UI. Every interaction feels intentional." },
  { name: "Miguel Alvarez", role: "Musician", rating: 5, quote: "Touring across 9 countries with one card. No surprise fees. That's the dream." },
  { name: "Chloe Bennett", role: "Yoga Instructor", rating: 5, quote: "I moved my whole life savings into a Growth Vault. Sleeping better already." },
  { name: "Nikolai Petrov", role: "Data Analyst", rating: 4, quote: "The trading UI is snappy and the fills are honest. Rare combination." },
  { name: "Aditi Sharma", role: "Physiotherapist", rating: 5, quote: "Sent money to my parents in Delhi at the real rate. They thought I made a mistake." },
  { name: "Tomás Ferreira", role: "Restaurateur", rating: 5, quote: "Payroll, tips, savings — all on one dashboard. My accountant loves me now." },
  { name: "Grace Whitman", role: "Nurse Practitioner", rating: 5, quote: "The PIN prompt and confirm modals make me feel safe. Small details, huge trust." },
  { name: "Yusuf Adeyemi", role: "Civil Engineer", rating: 5, quote: "I've referred nine friends. Every one of them has stuck around. Says it all." },
];

const AVATAR_TONES = [
  "from-rose-400 to-orange-400",
  "from-sky-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-400 to-purple-500",
  "from-amber-400 to-yellow-500",
  "from-cyan-400 to-blue-500",
  "from-lime-400 to-green-500",
  "from-pink-400 to-rose-500",
];

function shuffle<X>(arr: X[]): X[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TestimonialsCarousel() {
  const items = useMemo(() => shuffle(ALL).slice(0, 12), []);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);
  const next = () => setIdx((i) => (i + 1) % items.length);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {items.map((t, i) => (
            <div key={`${t.name}-${i}`} className="w-full shrink-0 px-1 sm:px-3">
              <div className="glass mx-auto max-w-2xl rounded-3xl p-6 md:p-10">
                <div className="flex items-center gap-4">
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br ${AVATAR_TONES[i % AVATAR_TONES.length]} text-lg font-bold text-white shadow-elegant`}>
                    {t.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{t.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`h-4 w-4 ${s < t.rating ? "fill-current" : "opacity-30"}`} />
                  ))}
                </div>
                <p className="mt-3 text-base leading-relaxed md:text-lg">"{t.quote}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        aria-label="Previous testimonial"
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 p-2 shadow-elegant backdrop-blur transition hover:scale-105 hover:text-primary md:-left-4"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Next testimonial"
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 p-2 shadow-elegant backdrop-blur transition hover:scale-105 hover:text-primary md:-right-4"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to testimonial ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
          />
        ))}
      </div>
    </div>
  );
}