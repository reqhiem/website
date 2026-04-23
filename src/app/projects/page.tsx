import { getProjects } from "@/lib/content";
import { Section } from "@/components/Section";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProjectsContent } from "@/components/ProjectsContent";

export default function ProjectsPage() {
  const projects = getProjects();
  const types = Array.from(new Set(projects.map((project) => project.type)));

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Section title="Projects" subtitle="Filter">
          <ProjectsContent projects={projects} types={types} />
        </Section>
      </main>
      <Footer />
    </>
  );
}
