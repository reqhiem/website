import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md bg-black/[0.04] px-2 py-0.5 text-xs text-muted dark:bg-white/[0.06]",
      className
    )}>
      {label}
    </span>
  );
}
