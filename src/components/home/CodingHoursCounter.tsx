import { useEffect, useState } from "react";
import { Code2 } from "lucide-react";

// Baseline: 8,000 hours as of May 6, 2026 — ticks up in real time from there.
const BASELINE_HOURS = 8000;
const BASELINE_TS = new Date("2026-05-06T00:00:00Z").getTime();

const CodingHoursCounter = () => {
  const [hours, setHours] = useState(() => {
    const elapsedMs = Date.now() - BASELINE_TS;
    return BASELINE_HOURS + Math.max(0, elapsedMs / 3_600_000);
  });

  useEffect(() => {
    const id = setInterval(() => {
      const elapsedMs = Date.now() - BASELINE_TS;
      setHours(BASELINE_HOURS + Math.max(0, elapsedMs / 3_600_000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const display = hours.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-xs sm:text-sm">
      <Code2 className="w-4 h-4" />
      <span className="font-bold tabular-nums">{display}</span>
      <span className="text-muted-foreground">hours coded · and counting</span>
    </div>
  );
};

export default CodingHoursCounter;
