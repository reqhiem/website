import { getProjects, type Language } from "@/lib/content";
import { Section } from "@/components/Section";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProjectsContent } from "@/components/ProjectsContent";

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale as Language;
  
  const projects = getProjects();
  const types = Array.from(new Set(projects.map((project) => project.type)));

  const pageTitle = lang === "es" ? "Proyectos" : "Projects";
  const pageSubtitle = lang === "es" ? "Filtro" : "Filter";

  return (
    <>
      <Navbar lang={lang} />
      <main className="min-h-[70vh]">
        <Section title={pageTitle} subtitle={pageSubtitle}>
          <ProjectsContent projects={projects} types={types} lang={lang} />
        </Section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
