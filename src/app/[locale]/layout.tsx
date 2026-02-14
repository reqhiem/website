import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "../globals.css";
import siteData from '@/content/site.json';
import { JsonLd } from './components/json-ld';

// Static metadata removed in favor of generateMetadata

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Omit<RootLayoutProps, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  const t = siteData.site;
  const isEs = locale === 'es';
  
  const title = t.title;
  const description = isEs ? t.seo.descriptionEs : t.seo.descriptionEn;
  const url = `https://${t.domain}/${locale === 'en' ? '' : locale}`;

  return {
    title: {
      default: title,
      template: `%s | ${t.domain}`,
    },
    description,
    metadataBase: new URL(`https://${t.domain}`),
    alternates: {
      canonical: url,
      languages: {
        'en': `https://${t.domain}`,
        'es': `https://${t.domain}/es`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: title,
      locale: locale,
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

export default async function RootLayout({
  children,
  params
}: RootLayoutProps) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Prepare structured data
  const t = siteData.site;
  const person = siteData.person;
  const isEs = locale === 'es';

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: isEs ? person.headlineEs : person.headlineEn,
    url: `https://${t.domain}`,
    sameAs: person.links.map((link: { url: string }) => link.url),
    knowsAbout: [
      ...siteData.skills.core,
      ...siteData.skills.aiMl,
      ...siteData.skills.dataViz
    ],
    description: isEs ? person.summaryEs : person.summaryEn,
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
    <html lang={locale}>
      <head>
        <JsonLd data={jsonLdData} />
      </head>
      <body className={`antialiased ${spaceGrotesk.variable} ${spaceGrotesk.className}`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
