"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import type { BlogPostMeta } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { BlogCard } from "./BlogCard";

interface BlogExplorerProps {
  posts: BlogPostMeta[];
  categories: string[];
  tags: string[];
}

const ALL = "all";

export function BlogExplorer({ posts, categories, tags }: BlogExplorerProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setQuery("");
    setActiveCategory(ALL);
    setActiveTags([]);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (activeCategory !== ALL && post.category !== activeCategory) return false;
      if (activeTags.length > 0 && !activeTags.every((t) => post.tags.includes(t))) return false;
      if (q) {
        const hay = `${post.title} ${post.description} ${post.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, query, activeCategory, activeTags]);

  const hasActiveFilters = query !== "" || activeCategory !== ALL || activeTags.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center gap-3">
          <Search size={16} className="text-black/50 dark:text-white/50" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search posts, topics, or tags…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-black/40 dark:placeholder:text-white/40"
            aria-label="Search blog posts"
          />
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-black/70 transition hover:border-accent hover:text-accent dark:border-white/15 dark:text-white/70"
            >
              <X size={12} /> Reset
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={activeCategory === ALL}
            onClick={() => setActiveCategory(ALL)}
            label={`All · ${posts.length}`}
          />
          {categories.map((category) => {
            const count = posts.filter((p) => p.category === category).length;
            return (
              <FilterChip
                key={category}
                active={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                label={`${category} · ${count}`}
              />
            );
          })}
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-black/5 pt-4 dark:border-white/10">
            <span className="text-[10px] uppercase tracking-[0.3em] text-black/50 dark:text-white/40">
              Tags
            </span>
            {tags.map((tag) => (
              <TagChip
                key={tag}
                active={activeTags.includes(tag)}
                onClick={() => toggleTag(tag)}
                label={tag}
              />
            ))}
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 p-12 text-center text-sm text-black/60 dark:border-white/10 dark:text-white/60">
          No posts match these filters.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] transition",
        active
          ? "border-accent bg-accent text-white"
          : "border-black/10 text-black/70 hover:border-accent/60 hover:text-accent dark:border-white/15 dark:text-white/70"
      )}
    >
      {label}
    </button>
  );
}

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] transition",
        active
          ? "border-accent/70 bg-accent/10 text-accent"
          : "border-black/10 text-black/60 hover:border-accent/50 hover:text-accent dark:border-white/15 dark:text-white/60"
      )}
    >
      #{label}
    </button>
  );
}
