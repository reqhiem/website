import { MetadataRoute } from 'next';
import siteData from '@/content/site.json';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${siteData.site.domain}`;
  const routes = siteData.site.routes;

  return routes.map((route) => {
    const path = route.path === '/' ? '' : route.path;
    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1.0 : 0.8,
    };
  });
}
