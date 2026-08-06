import { cn } from "@/lib/utils";
import type { GithubActivityPoint } from "@/lib/github";

interface ActivityPulseProps {
  points: GithubActivityPoint[];
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatMonthLabel = (monthKey: string): string => {
  // monthKey is "YYYY-MM"; render as "Mmm"
  const monthIndex = Number(monthKey.slice(5, 7)) - 1;
  return MONTH_SHORT[monthIndex] ?? monthKey.slice(5);
};

export function ActivityPulse({ points }: ActivityPulseProps) {
  if (!points.length) {
    return (
      <p className="mt-6 text-sm text-black/60 dark:text-white/70">
        Activity data unavailable.
      </p>
    );
  }

  const maxActivity = Math.max(...points.map((point) => point.count), 1);
  const latestMonth = points[points.length - 1].month;

  return (
    <>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted dark:text-white/60">
        Last {points.length} {points.length === 1 ? "month" : "months"} · contributions
      </p>
      <div className="relative mt-6 h-32 w-full">
        <div
          className="grid h-full items-end gap-2"
          style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
        >
          {points.map((point) => {
            const isLatest = point.month === latestMonth;
            return (
              <div
                key={point.month}
                className="group/bar flex h-full flex-col items-center justify-end gap-2"
              >
                <span
                  className={cn(
                    "text-[10px] tabular-nums opacity-0 transition-opacity group-hover/bar:opacity-100",
                    isLatest
                      ? "font-semibold text-accent opacity-100"
                      : "text-black/60 dark:text-white/70",
                  )}
                >
                  {point.count.toLocaleString()}
                </span>
                <div
                  className={cn(
                    "w-3 rounded-full transition-colors",
                    isLatest ? "bg-accent" : "bg-accent/40 group-hover/bar:bg-accent",
                  )}
                  style={{
                    height: `${Math.max(6, Math.round((point.count / maxActivity) * 80))}px`,
                  }}
                />
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-[0.2em]",
                    isLatest ? "text-accent" : "text-black/50 dark:text-white/50",
                  )}
                >
                  {formatMonthLabel(point.month)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
