import {
  getPerson,
  getSite,
  getInsights,
  getFeaturedProjects,
  getFeaturedResearch,
  getExperienceSorted,
  formatDateRange,
  localizeList,
  type Language
} from "@/lib/content";
import { Hero } from "@/components/hero/Hero";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { Timeline } from "@/components/Timeline";
import { TimelineItem } from "@/components/TimelineItem";
import { ProjectCard } from "@/components/ProjectCard";
import { ResearchCard } from "@/components/ResearchCard";
import { Activity } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// This is a Server Component, so we can access params prop
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale as Language;
  
  const site = getSite();
  const person = getPerson();
  const insights = getInsights();
  const routes = site.routes;
  const featuredProjects = getFeaturedProjects();
  const featuredResearch = getFeaturedResearch();
  const experience = getExperienceSorted().slice(0, 4);
  const proofPoints = person.positioning.proofPoints;
  
  const impactSection = insights.recommendedFeaturedSections.find((item) => item.id === "impact");
  const researchSection = insights.recommendedFeaturedSections.find((item) => item.id === "featured-research");
  const projectSection = insights.recommendedFeaturedSections.find((item) => item.id === "featured-projects");
  
  const experienceRoute = routes.find((route) => route.path === "/experience");
  const contactRoute = routes.find((route) => route.path === "/contact");

  const impactTitle = lang === "es" ? impactSection?.titleEs : impactSection?.titleEn;
  const researchTitle = lang === "es" ? researchSection?.titleEs : researchSection?.titleEn;
  const projectTitle = lang === "es" ? projectSection?.titleEs : projectSection?.titleEn;
  const experienceTitle = lang === "es" ? experienceRoute?.labelEs : experienceRoute?.labelEn;
  const contactTitle = lang === "es" ? contactRoute?.labelEs : contactRoute?.labelEn;
  const tagline = lang === "es" ? site.taglineEs : site.taglineEn;

  return (
    <>
      <Navbar lang={lang} />
      <main className="min-h-[70vh]">
        <Hero person={person} site={site} insights={insights} lang={lang} />

        <Section title={impactTitle} subtitle={impactTitle}>
          <div className="grid gap-6 md:grid-cols-3">
            {proofPoints.map((point, index) => (
              <Card key={index}>
                <div className="flex items-center gap-3">
                  <Activity size={20} className="text-[color:var(--color-accent)]" />
                  <p className="text-3xl font-semibold text-[color:var(--color-accent)]">{point.metric}</p>
                </div>
                <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                  {lang === "es" ? point.claimEs : point.claimEn}
                </p>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={researchTitle} subtitle={researchTitle}>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredResearch.map((project, index) => (
              <ResearchCard key={index} project={project} lang={lang} />
            ))}
          </div>
        </Section>

        <Section title={projectTitle} subtitle={projectTitle}>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredProjects.map((project, index) => (
              <ProjectCard 
                key={index} 
                project={{ ...project, highlights: localizeList(project.highlights, lang) }} 
                lang={lang} 
              />
            ))}
          </div>
        </Section>

        <Section title={experienceTitle} subtitle={experienceTitle}>
          <Timeline>
            {experience.map((item, index) => (
              <TimelineItem
                key={index}
                title={`${lang === "es" ? item.titleEs : item.titleEn} · ${item.company}`}
                subtitle={item.location}
                meta={formatDateRange(item.start, item.end, lang)}
              >
                <p>{lang === "es" ? item.summaryEs : (item as any).summaryEn}</p>
                <ul className="list-disc pl-4">
                  {localizeList(item.highlights, lang).map((highlight: string, hIndex) => (
                    <li key={hIndex}>{highlight}</li>
                  ))}
                </ul>
              </TimelineItem>
            ))}
          </Timeline>
        </Section>

        <Section title={contactTitle} subtitle={contactTitle}>
          <Card className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">{tagline}</h3>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">{person.emails[0].value}</p>
            </div>
            <a
              className="rounded-full bg-[color:var(--color-accent)] px-6 py-3 text-sm font-semibold text-white"
              href="/contact"
            >
              {contactTitle}
            </a>
          </Card>
        </Section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
