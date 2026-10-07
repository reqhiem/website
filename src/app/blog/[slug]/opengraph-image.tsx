import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { OG_SIZE, OgCard } from "@/components/og/OgCard";
import { getPostBySlug, getPostSlugs } from "@/lib/blog";
import { getPerson, getSite } from "@/lib/content";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Blog post cover";

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return new Response("Not found", { status: 404 });

  if (post.cover) {
    const png = await fs.readFile(path.join(process.cwd(), "public", post.cover));
    const src = `data:image/png;base64,${png.toString("base64")}`;
    return new ImageResponse(
      <img src={src} alt="" width={OG_SIZE.width} height={OG_SIZE.height} />,
      size,
    );
  }

  return new ImageResponse(
    <OgCard
      eyebrow={`${getSite().domain} · ${post.category}`}
      title={post.title}
      footer={`${getPerson().name} · ${post.readingText}`}
    />,
    size,
  );
}
