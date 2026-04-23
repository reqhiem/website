"use client";

import { useEffect, useState } from "react";

import type { TocHeading } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface TableOfContentsProps {
  headings: TocHeading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
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
      <p className="text-[10px] uppercase tracking-[0.3em] text-black/50 dark:text-white/40">
        On this page
      </p>
      <ol className="flex flex-col gap-1 border-l border-black/10 dark:border-white/10">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1 pl-3 transition",
                heading.level === 3 ? "pl-6 text-xs" : "",
                activeId === heading.id
                  ? "border-accent text-accent"
                  : "border-transparent text-black/60 hover:border-black/30 hover:text-black dark:text-white/50 dark:hover:border-white/30 dark:hover:text-white"
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
