import { MetadataRoute } from 'next';
import siteData from '@/content/site.json';
import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${siteData.site.domain}`;
  const routes = siteData.site.routes;
  const locales = routing.locales;

  // Create a sitemap entry for each route in each locale
  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of routes) {
      const path = route.path === '/' ? '' : route.path;
      // Handle localized path prefixes if needed, but routing.ts says 'as-needed'
      // effectively for 'en' (default) it might be / and for 'es' /es
      // However, sitemap usually prefers explicit full URLs.
      
      // We'll construct URL based on locale
      const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;
      const url = `${baseUrl}${localePrefix}${path}`;
      
      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: path === '' ? 1.0 : 0.8,
      });
    }
  }

  return sitemapEntries;
}
