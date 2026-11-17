import type { ReactNode } from "react";

interface TimelineItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  /** Small secondary line under the date, e.g. "Education". */
  kind?: string;
  children?: ReactNode;
}

export function TimelineItem({ title, subtitle, meta, kind, children }: TimelineItemProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[11rem_1fr]">
      <div className="font-mono text-xs tabular-nums whitespace-nowrap text-muted">
        {meta}
        {kind ? <p className="mt-1 font-sans text-xs font-medium text-data">{kind}</p> : null}
      </div>
      <div>
        <p className="text-lg font-semibold">{title}</p>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        <div className="mt-3 space-y-2 text-sm text-black/70 dark:text-white/70">
          {children}
        </div>
      </div>
    </div>
  );
}
