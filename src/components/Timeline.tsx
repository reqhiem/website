import type { ReactNode } from "react";

export function Timeline({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      {children}
    </div>
  );
}
