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
    keywords: t.seo.keywords,
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

  const publications = [
    {
      '@type': 'ScholarlyArticle',
      headline:
        'UrbanClipAtlas: A Visual Analytics Framework for Event and Scene Retrieval in Urban Videos',
      author: [
        'Joel Perca',
        'Luis Sante Taipe',
        'Juanpablo Heredia',
        'João Rulff',
        'Claudio Silva',
        'Jorge Poco',
      ].map((name) => ({ '@type': 'Person', name })),
      isPartOf: {
        '@type': 'Periodical',
        name: 'Computer Graphics Forum',
      },
      datePublished: '2026-04-06',
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'DOI',
        value: '10.1111/cgf.70431',
      },
      url: 'https://doi.org/10.1111/cgf.70431',
      sameAs: 'https://arxiv.org/abs/2604.15225',
    },
    {
      '@type': 'ScholarlyArticle',
      headline:
        'STRive: An association rule-based system for the exploration of spatiotemporal categorical data',
      author: [
        'Mauro Diaz',
        'Luis Sante Taipe',
        'Joel Perca',
        'João Da Silva',
        'Nivan Ferreira',
        'Jorge Poco',
      ].map((name) => ({ '@type': 'Person', name })),
      isPartOf: {
        '@type': 'Periodical',
        name: 'Computers & Graphics',
      },
      datePublished: '2025',
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'DOI',
        value: '10.1016/j.cag.2025.104410',
      },
      url: 'https://doi.org/10.1016/j.cag.2025.104410',
      sameAs: 'https://arxiv.org/abs/2509.02732',
    },
  ];

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: person.headline,
    url: `https://${t.domain}`,
    sameAs: person.links.map((link: { url: string }) => link.url),
    knowsAbout: Array.from(
      new Set([
        ...siteData.skills.core,
        ...siteData.skills.aiMl,
        ...siteData.skills.dataViz,
        ...siteData.research.interests,
        'Retrieval-Augmented Generation',
        'Information Visualization',
        'Urban Computing',
      ])
    ),
    description: person.summary,
    worksFor: {
      '@type': 'Organization',
      name: person.affiliation,
    },
    // Only conferred degrees. The in-progress PhD would otherwise assert
    // alumnus status for a degree that has not been awarded (and duplicate
    // FGV EMAp in the list); the current enrolment is covered by worksFor.
    alumniOf: siteData.education
      .filter((edu) => edu.end !== null)
      .map((edu) => ({
        '@type': 'CollegeOrUniversity',
        name: edu.institution,
        description: `${edu.degree} (${edu.start} — ${edu.end})`,
      })),
    subjectOf: publications,
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
