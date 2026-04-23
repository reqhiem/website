import { getResearch } from "@/lib/content";
import { ResearchCard } from "@/components/ResearchCard";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ResearchPage() {
  const research = getResearch();

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Section title="Research" subtitle="Projects">
          <div className="grid gap-6 md:grid-cols-2">
            {research.projects.map((project, index) => (
              <ResearchCard key={index} project={project} />
            ))}
          </div>
        </Section>

        <Section title="Collaboration" subtitle="Callout">
          <Card>
            <h3 className="text-xl font-semibold">Let’s collaborate.</h3>
            <p className="mt-3 text-sm text-black/70 dark:text-white/70">
              Open to research collaborations in computer vision, agentic RAG systems, and visual analytics.
            </p>
            <a className="mt-4 inline-flex rounded-full bg-[color:var(--color-accent)] px-5 py-2 text-sm font-semibold text-white" href="/contact">
              Get in touch
            </a>
          </Card>
        </Section>
      </main>
      <Footer />
    </>
  );
}
