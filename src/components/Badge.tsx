import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-black/70 dark:border-white/15 dark:text-white/70",
      className
    )}>
      {label}
    </span>
  );
}
