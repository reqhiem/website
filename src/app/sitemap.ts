import { MetadataRoute } from 'next';
import siteData from '@/content/site.json';
import { getAllPosts } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${siteData.site.domain}`;
  const routes = siteData.site.routes;

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => {
    const path = route.path === '/' ? '' : route.path;
    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1.0 : 0.8,
    };
  });

  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...postEntries];
}
