import type { ReactNode } from "react";

interface TimelineItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  children?: ReactNode;
}

export function TimelineItem({ title, subtitle, meta, children }: TimelineItemProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[140px_1fr]">
      <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
        {meta}
      </div>
      <div>
        <p className="text-lg font-semibold">{title}</p>
        {subtitle && <p className="text-sm text-black/60 dark:text-white/70">{subtitle}</p>}
        <div className="mt-3 space-y-2 text-sm text-black/70 dark:text-white/70">
          {children}
        </div>
      </div>
    </div>
  );
}
