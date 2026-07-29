import { useEffect, useState } from "react";
import { Logo } from "./logo";

export function Preloader() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1600);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <div className="animate-fade-up text-center">
        <div className="flex justify-center"><Logo size={72} /></div>
        <p className="mt-3 text-sm text-muted-foreground">Premium digital banking</p>
      </div>
    </div>
  );
}