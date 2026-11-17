import { Archivo, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import type { Metadata } from "next";

// Archivo's width axis gives condensed headings (font-stretch in globals.css).
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", axes: ["wdth"] });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  style: ["normal", "italic"],
});
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

// Runs before paint so a saved/OS dark preference never flashes light.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
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

  // Peer-reviewed papers only; challenge entries are not publications of record.
  const publications = siteData.research.projects
    .filter((paper) => paper.kind === 'paper')
    .map((paper) => {
      const arxiv = paper.links.find((link) => link.label === 'arXiv')?.url;
      const page = paper.links.find((link) => link.label === 'Project page')?.url;
      return {
        '@type': 'ScholarlyArticle',
        headline: paper.title,
        author: paper.authors.map((name) => ({ '@type': 'Person', name })),
        image: `https://${t.domain}${paper.image.src}`,
        ...(paper.doi
          ? {
              isPartOf: { '@type': 'Periodical', name: paper.venue.split(/[,(]/)[0].trim() },
              datePublished: paper.date,
              identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: paper.doi },
              url: `https://doi.org/${paper.doi}`,
            }
          : {
              // Accepted, not yet in the proceedings: no DOI or publication date yet.
              publication: {
                '@type': 'PublicationEvent',
                name: paper.venue.replace(/^Proc\. /, '').split(' — ')[0],
              },
              creativeWorkStatus: 'In print',
              url: page,
            }),
        ...(arxiv ? { sameAs: arxiv } : {}),
      };
    });

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
    <html
      lang="en"
      suppressHydrationWarning
      // Font variables on <html> so the @theme tokens (resolved at :root) see them.
      className={`${archivo.variable} ${sourceSerif.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <JsonLd data={jsonLdData} />
      </head>
      <body className="antialiased font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
