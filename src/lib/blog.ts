import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import GithubSlugger from "github-slugger";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

import { buildCanonical } from "./content";

const POSTS_DIR = path.join(process.cwd(), "src", "content", "blog");

export type BlogCategory = "Software Engineering" | "AI" | "Research" | "Tooling";

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: BlogCategory;
  tags: string[];
  cover?: string;
  featured?: boolean;
  draft?: boolean;
  author?: string;
}

export interface BlogPostMeta extends BlogFrontmatter {
  slug: string;
  readingMinutes: number;
  readingText: string;
  url: string;
}

export interface BlogPost extends BlogPostMeta {
  html: string;
  headings: TocHeading[];
}

export interface TocHeading {
  level: number;
  id: string;
  text: string;
}

function getPostFiles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => /\.mdx?$/.test(file));
}

function readPostFile(file: string): { raw: string; slug: string } {
  const slug = file.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
  return { raw, slug };
}

function toMeta(slug: string, frontmatter: BlogFrontmatter, content: string): BlogPostMeta {
  const { minutes, text } = readingTime(content);
  return {
    ...frontmatter,
    slug,
    readingMinutes: Math.max(1, Math.round(minutes)),
    readingText: text,
    url: buildCanonical(`/blog/${slug}`),
  };
}

export function getAllPosts(): BlogPostMeta[] {
  const files = getPostFiles();
  const posts = files.map((file) => {
    const { raw, slug } = readPostFile(file);
    const { data, content } = matter(raw);
    return toMeta(slug, data as BlogFrontmatter, content);
  });

  const includeDrafts = process.env.NODE_ENV !== "production";
  return posts
    .filter((post) => includeDrafts || !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

export function getFeaturedPosts(limit = 3): BlogPostMeta[] {
  return getAllPosts()
    .filter((post) => post.featured)
    .slice(0, limit);
}

export function getAllCategories(): string[] {
  const set = new Set(getAllPosts().map((post) => post.category));
  return Array.from(set).sort();
}

export function getAllTags(): string[] {
  const set = new Set(getAllPosts().flatMap((post) => post.tags ?? []));
  return Array.from(set).sort();
}

async function compileMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: {
        className: ["heading-anchor"],
        ariaLabel: "Link to section",
      },
    })
    .use(rehypeKatex)
    .use(rehypePrettyCode, {
      theme: { dark: "github-dark", light: "github-light" },
      keepBackground: true,
      defaultLang: "plaintext",
      bypassInlineCode: true,
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(file);
}

function extractHeadings(markdown: string): TocHeading[] {
  const lines = markdown.split(/\r?\n/);
  const out: TocHeading[] = [];
  const slugger = new GithubSlugger();
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].replace(/`([^`]+)`/g, "$1").trim();
    const id = slugger.slug(text);
    out.push({ level, id, text });
  }
  return out;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const files = getPostFiles();
  const file = files.find((f) => f.replace(/\.mdx?$/, "") === slug);
  if (!file) return null;

  const { raw } = readPostFile(file);
  const { data, content } = matter(raw);
  const meta = toMeta(slug, data as BlogFrontmatter, content);
  const html = await compileMarkdown(content);
  const headings = extractHeadings(content);

  return {
    ...meta,
    html,
    headings,
  };
}

export function getAdjacentPosts(slug: string): {
  prev: BlogPostMeta | null;
  next: BlogPostMeta | null;
} {
  const posts = getAllPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: index < posts.length - 1 ? posts[index + 1] : null,
    next: index > 0 ? posts[index - 1] : null,
  };
}
