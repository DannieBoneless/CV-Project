import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, CloudSun, Snowflake, CloudLightning } from "lucide-react";

function greetingFor(now: Date) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

type Weather = { temp: number; code: number; label: string };

function labelForCode(code: number): { label: string; Icon: typeof Sun } {
  if ([0].includes(code)) return { label: "Clear", Icon: Sun };
  if ([1, 2].includes(code)) return { label: "Partly cloudy", Icon: CloudSun };
  if ([3].includes(code)) return { label: "Cloudy", Icon: Cloud };
  if ([45, 48].includes(code)) return { label: "Foggy", Icon: Cloud };
  if (code >= 51 && code <= 67) return { label: "Rain", Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Snow", Icon: Snowflake };
  if (code >= 80 && code <= 82) return { label: "Showers", Icon: CloudRain };
  if (code >= 95) return { label: "Thunder", Icon: CloudLightning };
  return { label: "Fair", Icon: CloudSun };
}

export function GreetingWeather({ name }: { name: string }) {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    async function fetchWeather(lat: number, lon: number) {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,
        );
        const j = await res.json();
        const code = j?.current?.weather_code ?? 1;
        const temp = Math.round(j?.current?.temperature_2m ?? 72);
        if (alive) setWeather({ temp, code, label: labelForCode(code).label });
      } catch {
        if (alive) setWeather({ temp: 72, code: 1, label: "Fair" });
      }
    }
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(40.71, -74.0), // fallback: NYC
        { timeout: 4000 },
      );
    } else {
      fetchWeather(40.71, -74.0);
    }
    return () => { alive = false; };
  }, []);

  const { Icon } = weather ? labelForCode(weather.code) : { Icon: CloudSun };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{greetingFor(now)},</div>
        <div className="truncate text-xl font-bold">{name || "there"} 👋</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-2">
        <Icon className="h-8 w-8 text-primary" />
        <div className="text-right">
          <div className="text-lg font-bold leading-none">{weather ? `${weather.temp}°F` : "—"}</div>
          <div className="text-[10px] text-muted-foreground">{weather?.label ?? "Loading…"}</div>
        </div>
      </div>
    </div>
  );
}