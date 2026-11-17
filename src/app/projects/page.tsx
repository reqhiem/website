import { getProjects, getResearch, pageMetadata } from "@/lib/content";
import { Section } from "@/components/Section";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProjectCard } from "@/components/ProjectCard";
import { ResearchCard } from "@/components/ResearchCard";

export const metadata = pageMetadata(
  "/projects",
  "Publications & projects",
  "Peer-reviewed papers, IEEE VAST Challenge 2026 entries and open-source projects by Joel Perca: urban video retrieval, visual analytics, multi-agent systems and developer tools.",
);

export default function ProjectsPage() {
  const research = getResearch().projects;
  const papers = research.filter((r) => r.kind === "paper");
  const challenge = research.filter((r) => r.kind === "challenge");
  const projects = getProjects();
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Section
          id="publications"
          title="Publications"
          subtitle="Urban video, 3D pedestrian sensing and visual analytics from the Visual Data Science Lab at FGV EMAp."
          as="h1"
        >
          <h2 className="text-2xl font-semibold md:text-3xl">Peer-reviewed papers</h2>
          <div className="mt-8 flex flex-col gap-6">
            {papers.map((paper, index) => (
              <ResearchCard key={paper.slug} project={paper} priority={index === 0} />
            ))}
          </div>

          <h2 id="vast-challenge" className="mt-16 scroll-mt-24 text-2xl font-semibold md:text-3xl">
            IEEE VAST Challenge 2026
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Two visual analytics systems built by our lab for the 2026 challenge on multi-agent systems.
          </p>
          <div className="mt-8 flex flex-col gap-6">
            {challenge.map((entry) => (
              <ResearchCard key={entry.slug} project={entry} />
            ))}
          </div>
        </Section>

        <Section id="projects" title="Projects" subtitle="Tools and platforms I built or contributed to, with code you can read.">
          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
          {others.length ? (
            <>
              <h2 className="mt-14 text-xl font-semibold">Also built</h2>
              <ul className="mt-4 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
                {others.map((project) => (
                  <li key={project.slug} className="grid gap-1 py-4 md:grid-cols-[12rem_1fr] md:gap-6">
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-muted">{project.oneLiner}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </Section>
      </main>
      <Footer />
    </>
  );
}
