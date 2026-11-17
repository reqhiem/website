import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Tag } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/app/components/json-ld";
import { BlogCard } from "@/components/blog/BlogCard";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import {
  getAdjacentPosts,
  getPostBySlug,
  getPostSlugs,
  getRelatedPosts,
} from "@/lib/blog";
import { buildCanonical, getPerson, getSite } from "@/lib/content";

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
  // og:image comes from ./opengraph-image.tsx.
  return {
    title: post.seoTitle ?? post.title,
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
      siteName: getSite().title,
      authors: [buildCanonical("/about")],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
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
  const related = getRelatedPosts(slug);
  const person = getPerson();
  const author = { "@type": "Person", name: person.name, url: buildCanonical("/about") };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author,
    publisher: author,
    keywords: post.tags.join(", "),
    articleSection: post.category,
    mainEntityOfPage: { "@type": "WebPage", "@id": post.url },
    url: post.url,
    image: [buildCanonical(`/blog/${post.slug}/opengraph-image`)],
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
                className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition hover:text-accent"
              >
                <ArrowLeft size={14} /> Back to blog
              </Link>
            </div>

            <header className="flex flex-col gap-6 border-b border-black/10 pb-10 dark:border-white/10">
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                {post.title}
              </h1>
              <p className="text-sm text-muted">
                By{" "}
                <Link href="/about" className="font-medium text-fg underline-offset-4 hover:text-accent hover:underline">
                  {post.author ?? person.name}
                </Link>
                {" · "}
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {" · "}
                {post.readingText}
              </p>
              <p className="max-w-3xl text-base text-black/70 dark:text-white/70 md:text-lg">
                {post.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Tag size={12} aria-hidden className="text-muted" />
                <span className="rounded-full border border-accent/40 bg-accent/5 px-2.5 py-1 text-accent">
                  {post.category}
                </span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-black/10 px-2.5 py-1 text-muted dark:border-white/15"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </header>

            {post.headings.length > 0 ? (
              <details className="mt-8 rounded-xl border border-black/10 px-4 dark:border-white/10 lg:hidden">
                <summary className="cursor-pointer py-3 text-sm font-medium">On this page</summary>
                <div className="pb-3">
                  <TableOfContents headings={post.headings} showLabel={false} />
                </div>
              </details>
            ) : null}

            <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div
                className="prose-blog min-w-0"
                dangerouslySetInnerHTML={{ __html: post.html }}
              />
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <TableOfContents headings={post.headings} />
                </div>
              </aside>
            </div>

            {related.length > 0 ? (
              <section className="mt-16 border-t border-black/10 pt-10 dark:border-white/10">
                <h2 className="mb-6 text-2xl font-semibold">
                  Related posts
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {related.map((relatedPost) => (
                    <BlogCard key={relatedPost.slug} post={relatedPost} />
                  ))}
                </div>
              </section>
            ) : null}

            <nav className="mt-16 grid gap-4 border-t border-black/10 pt-8 md:grid-cols-2 dark:border-white/10">
              {prev ? (
                <Link
                  href={`/blog/${prev.slug}`}
                  className="group flex flex-col gap-1 rounded-xl border border-black/10 p-5 transition hover:border-accent dark:border-white/10"
                >
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
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
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
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
