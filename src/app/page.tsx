import {
  getPerson,
  getResearch,
  getFeaturedProjects,
  getExperienceSorted,
  getEducation,
  formatDateRange,
} from "@/lib/content";
import { Hero } from "@/components/hero/Hero";
import { Section } from "@/components/Section";
import { Timeline } from "@/components/Timeline";
import { TimelineItem } from "@/components/TimelineItem";
import { ProjectCard } from "@/components/ProjectCard";
import { ResearchCard } from "@/components/ResearchCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const person = getPerson();
  const research = getResearch();
  const papers = research.projects.filter((r) => r.kind === "paper");
  const challengeCount = research.projects.length - papers.length;
  const current = research.current;
  const featuredProjects = getFeaturedProjects();
  // Lead the timeline with the PhD/MSc so the research track is visible on /.
  const timeline = [
    ...getEducation()
      .filter((e) => e.institution.includes("FGV"))
      .map((e) => ({ title: e.degree, subtitle: e.institution, meta: formatDateRange(e.start, e.end), summary: e.status ?? e.thesis?.title ?? "", highlights: [] as string[] })),
    ...getExperienceSorted()
      .slice(0, 2)
      .map((e) => ({ title: `${e.title} · ${e.company}`, subtitle: e.location, meta: formatDateRange(e.start, e.end), summary: e.summary, highlights: e.highlights })),
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Hero />

        <Section title={current.title} subtitle={current.summary}>
          <figure className="mb-8">
            <Image
              src="/images/research/urbanclipatlas.webp"
              width={1600}
              height={873}
              alt="UrbanClipAtlas: (A) chat panel answering a question about a cyclist and an SUV, (B) video frames with tracked objects, (C) timeline of related clips"
              sizes="(min-width: 1152px) 1104px, 100vw"
              className="w-full rounded-xl border border-black/10 bg-white p-2 md:p-4 dark:border-white/10"
            />
            <figcaption className="mt-3 font-mono text-xs text-muted">
              UrbanClipAtlas: (A) ask in plain language, (B) see the answer on tracked objects, (C) jump to related clips.
            </figcaption>
          </figure>
          <ol className="grid gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 md:grid-cols-3 dark:border-white/10 dark:bg-white/10">
            {current.threads.map((thread) => (
              <li key={thread.label} className="flex flex-col gap-2 bg-bg p-6">
                <p className="font-mono text-sm text-data">{thread.label}</p>
                <p className="text-fg/85">{thread.text}</p>
                <a
                  href={`/projects#publications`}
                  className="mt-auto pt-2 font-mono text-xs text-muted underline decoration-black/20 underline-offset-4 hover:text-fg dark:decoration-white/25"
                >
                  {thread.source}
                </a>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Publications" subtitle="Peer-reviewed papers from the Visual Data Science Lab at FGV EMAp.">
          <div className="flex flex-col gap-6">
            {papers.map((paper) => (
              <ResearchCard key={paper.slug} project={paper} />
            ))}
          </div>
          <Link
            href="/projects#vast-challenge"
            className="group mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline decoration-black/20 underline-offset-4 hover:decoration-signal dark:decoration-white/25"
          >
            Plus {challengeCount} IEEE VAST Challenge 2026 entries
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </Section>

        <Section title="Projects" subtitle="Tools and platforms I built or contributed to, with code you can read.">
          <div className="grid gap-6 md:grid-cols-2">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </Section>

        <Section title="Experience" subtitle="Research at FGV EMAp, preceded by engineering work in Peru.">
          <Timeline>
            {timeline.map((item) => (
              <TimelineItem key={item.title} title={item.title} subtitle={item.subtitle} meta={item.meta}>
                {item.summary ? <p>{item.summary}</p> : null}
                {item.highlights.length ? (
                  <ul className="list-disc pl-4">
                    {item.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                ) : null}
              </TimelineItem>
            ))}
          </Timeline>
          <Link
            href="/experience"
            className="group mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline decoration-black/20 underline-offset-4 hover:decoration-signal dark:decoration-white/25"
          >
            Full timeline
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </Section>

        <Section title="Let's talk" subtitle="Research collaborations, engineering work, or a question about the papers.">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              className="inline-flex min-h-12 items-center rounded-md bg-signal px-5 text-sm font-semibold text-ink transition hover:brightness-95"
              href="/contact"
            >
              Get in touch
            </Link>
            <a className="font-mono text-sm text-muted hover:text-fg" href={`mailto:${person.emails[0].value}`}>
              {person.emails[0].value}
            </a>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
