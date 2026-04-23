import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/app/components/json-ld";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import {
  getAdjacentPosts,
  getPostBySlug,
  getPostSlugs,
} from "@/lib/blog";
import { buildCanonical, getPerson } from "@/lib/content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return { title: "Post not found" };
  }

  const url = buildCanonical(`/blog/${post.slug}`);
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);
  const person = getPerson();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: {
      "@type": "Person",
      name: person.name,
      url: buildCanonical("/"),
    },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    mainEntityOfPage: { "@type": "WebPage", "@id": post.url },
    image: post.cover ? [post.cover] : undefined,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <ReadingProgress />
      <Navbar />
      <main className="min-h-[70vh]">
        <article className="pt-12 pb-16 md:pt-20">
          <div className="container-page">
            <div className="mb-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-black/60 transition hover:text-accent dark:text-white/60"
              >
                <ArrowLeft size={14} /> Back to blog
              </Link>
            </div>

            <header className="flex flex-col gap-6 border-b border-black/10 pb-10 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-black/60 dark:text-white/50">
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-3 py-1 text-accent">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                  {post.category}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} />
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} />
                  {post.readingText}
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                {post.title}
              </h1>
              <p className="max-w-3xl text-base text-black/70 dark:text-white/70 md:text-lg">
                {post.description}
              </p>
              {post.tags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Tag size={12} className="text-black/40 dark:text-white/40" />
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-black/60 dark:border-white/15 dark:text-white/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>

            <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div
                className="prose-blog"
                dangerouslySetInnerHTML={{ __html: post.html }}
              />
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <TableOfContents headings={post.headings} />
                </div>
              </aside>
            </div>

            <nav className="mt-16 grid gap-4 border-t border-black/10 pt-8 md:grid-cols-2 dark:border-white/10">
              {prev ? (
                <Link
                  href={`/blog/${prev.slug}`}
                  className="group flex flex-col gap-1 rounded-xl border border-black/10 p-5 transition hover:border-accent dark:border-white/10"
                >
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-black/50 dark:text-white/50">
                    <ArrowLeft size={12} /> Previous
                  </span>
                  <span className="text-sm font-medium group-hover:text-accent">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/blog/${next.slug}`}
                  className="group flex flex-col items-end gap-1 rounded-xl border border-black/10 p-5 text-right transition hover:border-accent dark:border-white/10"
                >
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-black/50 dark:text-white/50">
                    Next <ArrowRight size={12} />
                  </span>
                  <span className="text-sm font-medium group-hover:text-accent">
                    {next.title}
                  </span>
                </Link>
              ) : null}
            </nav>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
