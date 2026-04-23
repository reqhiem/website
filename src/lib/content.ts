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

export const getFeaturedResearch = () =>
  site.research.projects.slice(0, 2);

export const getPrimaryEmail = () =>
  site.person.emails.find((email) => email.primary)?.value ??
  site.person.emails[0]?.value ??
  "hello@example.com";

export const formatDateRange = (start: string, end: string | null) => {
  return `${start} — ${end ?? "Present"}`;
};

export const buildCanonical = (path: string) => {
  const domain = site.site.domain.replace(/\/$/, "");
  return `https://${domain}${path}`;
};
