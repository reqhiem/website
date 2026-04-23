import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import type { BlogPostMeta } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPostMeta;
  variant?: "default" | "featured";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function BlogCard({ post, variant = "default" }: BlogCardProps) {
  const isFeatured = variant === "featured";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-black/10 bg-white/70 p-6 backdrop-blur transition",
        "hover:border-accent/60 hover:shadow-[0_10px_40px_rgba(255,90,54,0.15)]",
        "dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-accent/60",
        isFeatured && "md:col-span-2 md:p-8"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 transition group-hover:opacity-100"
      />
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-black/60 dark:text-white/50">
        <span className="flex items-center gap-2">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          {post.category}
        </span>
        <span className="flex items-center gap-3">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className="flex items-center gap-1 opacity-70">
            <Clock size={12} />
            {post.readingMinutes}m
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <h3
          className={cn(
            "font-semibold tracking-tight text-ink transition group-hover:text-accent dark:text-paper",
            isFeatured ? "text-2xl md:text-3xl" : "text-xl"
          )}
        >
          {post.title}
        </h3>
        <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
          {post.description}
        </p>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-black/60 dark:border-white/15 dark:text-white/60"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-black/60 transition group-hover:border-accent group-hover:text-accent dark:border-white/15 dark:text-white/60">
          <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}
