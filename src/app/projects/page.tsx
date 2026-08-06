import { getProjects, getResearch } from "@/lib/content";
import { Section } from "@/components/Section";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProjectsContent } from "@/components/ProjectsContent";
import { ResearchCard } from "@/components/ResearchCard";

export default function ProjectsPage() {
  const projects = getProjects();
  const research = getResearch();
  const types = Array.from(new Set(projects.map((project) => project.type)));

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Section title="Publications" subtitle="Peer-reviewed">
          <div className="grid gap-6 md:grid-cols-2">
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
