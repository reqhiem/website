import { getResearch, type Language } from "@/lib/content";
import { ResearchCard } from "@/components/ResearchCard";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default async function ResearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale as Language;

  const research = getResearch();

  const sectionTitle = lang === "es" ? "Investigación" : "Research";
  const sectionSubtitle = lang === "es" ? "Proyectos" : "Projects";
  const collabTitle = lang === "es" ? "Colaboración" : "Collaboration";
  const collabSubtitle = lang === "es" ? "Llamado" : "Callout";
  const collabHeadline = lang === "es" ? "Colaboremos." : "Let’s collaborate.";
  const collabText = lang === "es" 
    ? "Abierto a colaboraciones de investigación en visión por computadora, sistemas Agentic RAG y analítica visual."
    : "Open to research collaborations in computer vision, agentic RAG systems, and visual analytics.";
  const btnText = lang === "es" ? "Contactar" : "Get in touch";

  return (
    <>
      <Navbar lang={lang} />
      <main className="min-h-[70vh]">
        <Section title={sectionTitle} subtitle={sectionSubtitle}>
          <div className="grid gap-6 md:grid-cols-2">
            {research.projects.map((project, index) => (
              <ResearchCard key={index} project={project} lang={lang} />
            ))}
          </div>
        </Section>

        <Section title={collabTitle} subtitle={collabSubtitle}>
          <Card>
            <h3 className="text-xl font-semibold">{collabHeadline}</h3>
            <p className="mt-3 text-sm text-black/70 dark:text-white/70">
              {collabText}
            </p>
            <a className="mt-4 inline-flex rounded-full bg-[color:var(--color-accent)] px-5 py-2 text-sm font-semibold text-white" href="/contact">
              {btnText}
            </a>
          </Card>
        </Section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
