import { MetadataRoute } from 'next';
import siteData from '@/content/site.json';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = `https://${siteData.site.domain}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/private/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
