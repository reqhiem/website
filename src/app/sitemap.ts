import { MetadataRoute } from 'next';
import siteData from '@/content/site.json';
import { getAllPosts } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${siteData.site.domain}`;
  const routes = siteData.site.routes;

  const posts = getAllPosts();
  const blogLastModified = posts.map((post) => post.updated ?? post.date).sort().at(-1);

  // No lastModified on static routes: a build timestamp would claim every
  // page changed on every deploy, and Google stops trusting lastmod. /blog
  // changes when a post does.
  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => {
    const path = route.path === '/' ? '' : route.path;
    return {
      url: `${baseUrl}${path}`,
      ...(path === '/blog' && blogLastModified
        ? { lastModified: new Date(blogLastModified) }
        : {}),
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1.0 : 0.8,
    };
  });

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...postEntries];
}
