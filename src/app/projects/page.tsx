import { getProjects, getResearch, pageMetadata } from "@/lib/content";
import { Section } from "@/components/Section";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProjectsContent } from "@/components/ProjectsContent";
import { ResearchCard } from "@/components/ResearchCard";

export const metadata = pageMetadata(
  "/projects",
  "Publications & projects",
  "Peer-reviewed publications and engineering projects by Joel Perca: urban video retrieval, visual analytics, vision-language and retrieval systems.",
);

export default function ProjectsPage() {
  const projects = getProjects();
  const research = getResearch();
  const types = Array.from(new Set(projects.map((project) => project.type)));

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Section title="Publications" subtitle="Peer-reviewed" as="h1">
          <div className="flex flex-col gap-6">
            {research.projects.map((project, index) => (
              <ResearchCard key={index} project={project} />
            ))}
          </div>
        </Section>

        <Section title="Projects" subtitle="Engineering work">
          <ProjectsContent projects={projects} types={types} />
        </Section>
      </main>
      <Footer />
    </>
  );
}
