import type { Metadata } from "next";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/Section";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogExplorer } from "@/components/blog/BlogExplorer";
import {
  getAllCategories,
  getAllPosts,
  getAllTags,
  getFeaturedPosts,
} from "@/lib/blog";
import { pageMetadata } from "@/lib/content";

const PAGE_TITLE = "Blog";
const PAGE_DESCRIPTION =
  "Notes from research and engineering: urban video understanding, vision-language and retrieval systems, visual analytics, and the tooling that ships them.";

export const metadata: Metadata = pageMetadata("/blog", PAGE_TITLE, PAGE_DESCRIPTION);

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const tags = getAllTags();
  const featured = getFeaturedPosts(1);
  const showHeroCard = featured.length > 0 && posts.length > 1;

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <section className="pt-16 pb-8 md:pt-24">
          <div className="container-page flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <p className="text-xs uppercase tracking-[0.35em] text-black/60 dark:text-white/50">
                <span className="inline-flex h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-accent align-middle" />{" "}
                Blog · {posts.length} {posts.length === 1 ? "entry" : "entries"}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                Writing from the lab
              </h1>
              <p className="max-w-2xl text-base text-black/70 dark:text-white/70 md:text-lg">
                {PAGE_DESCRIPTION}
              </p>
            </div>

            {showHeroCard ? (
              <div className="grid gap-6">
                <BlogCard post={featured[0]} variant="featured" />
              </div>
            ) : null}
          </div>
        </section>

        <Section subtitle="Explore" title="All posts">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 p-12 text-center text-sm text-black/60 dark:border-white/10 dark:text-white/60">
              No entries yet — check back soon.
            </div>
          ) : (
            <BlogExplorer
              posts={posts}
              categories={categories}
              tags={tags}
            />
          )}
        </Section>
      </main>
      <Footer />
    </>
  );
}
