import { FileText, ArrowRight, Terminal } from 'lucide-react';
import Link from 'next/link';
import HeroPortrait from './HeroPortrait';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] w-full flex items-center overflow-hidden bg-transparent">
      {/* Background grid — schematic feel, drawn in CSS (no image request). */}
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0" />

      <div className="container-page relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full pt-20 md:pt-0">

        {/* Left Column */}
        <div className="flex flex-col items-start gap-8 order-2 md:order-1">
          <div className="space-y-6">
            <div className="hero-reveal-x flex items-center gap-3" style={{ animationDelay: '100ms' }}>
              <div className="h-[1px] w-12 bg-accent/50" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted">
                Applied AI Research — Visual Analytics
              </span>
            </div>

            <div className="hero-reveal" style={{ animationDelay: '200ms' }}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.0] tracking-tight -ml-[2px]">
                AI <br/>
                Engineer <br/>
                <span className="text-muted font-light italic">+</span> <br/>
                <span className="text-accent">
                  Researcher
                </span>
              </h1>
            </div>

            <p
              className="hero-reveal text-lg md:text-xl text-muted max-w-lg leading-relaxed border-l-2 border-accent/20 pl-6"
              style={{ animationDelay: '400ms' }}
            >
              I research how to make long urban video searchable — vision-language models, agentic retrieval, visual analytics. Then I ship it: Django and DRF services, React front-ends, Docker and Kubernetes.
            </p>
          </div>

          <div className="hero-reveal flex flex-wrap gap-4 pt-2" style={{ animationDelay: '600ms' }}>
            <Link
              href="/projects"
              className="group relative px-6 py-3 bg-ink text-paper font-medium text-sm tracking-wide uppercase rounded-sm hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              View Projects
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="/resume.pdf"
              className="px-6 py-3 bg-transparent border border-ink/20 text-ink font-medium text-sm tracking-wide uppercase rounded-sm hover:border-ink transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Resume (PDF)
            </a>
          </div>
        </div>

        {/* Right Column */}
        <div className="relative h-[55vh] md:h-[72vh] flex items-end justify-center md:justify-end order-1 md:order-2 overflow-hidden">
          <HeroPortrait />
        </div>
      </div>
    </section>
  );
}
