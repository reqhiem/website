"use client";

import { useEffect, useState } from "react";

import type { TocHeading } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface TableOfContentsProps {
  headings: TocHeading[];
  /** Off when a surrounding <summary> already says "On this page". */
  showLabel?: boolean;
}

export function TableOfContents({ headings, showLabel = true }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0% -70% 0%", threshold: [0, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="flex flex-col gap-3 text-sm">
      {showLabel ? <p className="text-sm font-medium">On this page</p> : null}
      <ol className="flex flex-col gap-1 border-l border-black/10 dark:border-white/10">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? "location" : undefined}
              className={cn(
                "-ml-px flex min-h-11 items-center border-l-2 py-1 pl-3 transition lg:block lg:min-h-0",
                heading.level === 3 ? "pl-6 text-xs" : "",
                activeId === heading.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:border-black/30 hover:text-fg dark:hover:border-white/30"
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
