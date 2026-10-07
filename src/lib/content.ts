import type { Metadata } from "next";
import site from "../content/site.json";

export type SiteData = typeof site;

export const getSite = () => site.site;
export const getPerson = () => site.person;
export const getEducation = () => site.education;
export const getResearch = () => site.research;
export const getProjects = () => site.projects;
export const getAwards = () => site.awards;
export const getCertifications = () => site.certifications;
export const getLanguages = () => site.languages;
export const getSkills = () => site.skills;
export const getInsights = () => site.insightsForCopy;

export const getRoutes = () =>
  site.site.routes.map((route) => ({
    path: route.path,
    label: route.label,
  }));

export const getExperienceSorted = () => {
  const copy = [...site.experience];
  return copy.sort((a, b) => {
    const aEnd = a.end ?? "9999-12";
    const bEnd = b.end ?? "9999-12";
    if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
    return b.start.localeCompare(a.start);
  });
};

export const getFeaturedProjects = () =>
  site.projects.filter((project) => project.featured);

export const getFeaturedResearch = () => site.research.projects;

export const getPrimaryEmail = () =>
  site.person.emails.find((email) => email.primary)?.value ??
  site.person.emails[0]?.value ??
  "hello@reqhiem.dev";

export const formatDateRange = (start: string, end: string | null) => {
  return `${start} — ${end ?? "Present"}`;
};

export const buildCanonical = (path: string) => {
  const domain = site.site.domain.replace(/\/$/, "");
  return `https://${domain}${path}`;
};

// Every page must set its own canonical: without it Next inherits the root
// layout's, and Google folds the page into the home page as a duplicate.
// Overriding openGraph drops the inherited image, so point back at the
// site-wide one from src/app/opengraph-image.tsx.
export const pageMetadata = (
  path: string,
  title: string,
  description: string,
): Metadata => {
  const url = buildCanonical(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.site.title,
      type: "website",
      images: "/opengraph-image",
    },
    twitter: { card: "summary_large_image", title, description, images: "/opengraph-image" },
  };
};
