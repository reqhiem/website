import { Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";
import siteData from '@/content/site.json';
import { JsonLd } from './components/json-ld';

export async function generateMetadata(): Promise<Metadata> {
  const t = siteData.site;

  const title = t.title;
  const description = t.seo.description;
  const url = `https://${t.domain}`;

  return {
    title: {
      default: title,
      template: `%s | ${t.domain}`,
    },
    description,
    metadataBase: new URL(`https://${t.domain}`),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: title,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    }
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prepare structured data
  const t = siteData.site;
  const person = siteData.person;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: person.headline,
    url: `https://${t.domain}`,
    sameAs: person.links.map((link: { url: string }) => link.url),
    knowsAbout: [
      ...siteData.skills.core,
      ...siteData.skills.aiMl,
      ...siteData.skills.dataViz
    ],
    description: person.summary,
    worksFor: {
        '@type': 'Organization',
        name: siteData.experience[0].company
    },
    alumniOf: siteData.education.map((edu: { institution: string }) => ({
      '@type': 'EducationalOrganization',
      name: edu.institution
    }))
  };

  return (
    <html lang="en">
      <head>
        <JsonLd data={jsonLdData} />
      </head>
      <body className={`antialiased ${spaceGrotesk.variable} ${spaceGrotesk.className}`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
