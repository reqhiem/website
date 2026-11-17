import { ArrowRight, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Query and timestamps are the real ones shown in the UrbanClipAtlas paper figure.
const QUERY = "Are there any significant conflict events involving cyclists and cars?";
const HITS = ["09:10", "02:55", "08:45"];

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="container-page grid items-center gap-10 py-12 md:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
        <div className="flex flex-col items-start gap-6">
          <div className="hero-reveal-x flex items-center gap-3" style={{ animationDelay: "80ms" }}>
            <Image
              src="/images/frontal_portrait.webp"
              alt="Joel Perca"
              width={48}
              height={48}
              priority
              className="h-12 w-12 rounded-full object-cover object-[50%_25%] ring-1 ring-black/10 dark:ring-white/15"
            />
            <p className="text-sm leading-snug">
              <span className="font-semibold">Joel Perca</span>
              <span className="block text-muted">PhD student · FGV EMAp · Visual Data Science Lab</span>
            </p>
          </div>

          <h1
            className="hero-reveal text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "160ms" }}
          >
            I make long urban video <span className="text-accent">searchable.</span>
          </h1>

          <p
            className="hero-reveal max-w-xl text-lg leading-relaxed text-fg/80"
            style={{ animationDelay: "260ms" }}
          >
            AI engineer and researcher in Rio de Janeiro. I work on vision-language models, agentic
            retrieval and visual analytics, then ship them as production software: Django, React,
            Docker and Kubernetes.
          </p>

          <div className="hero-reveal flex flex-wrap gap-3 pt-1" style={{ animationDelay: "360ms" }}>
            <Link
              href="/projects#publications"
              className="group inline-flex min-h-12 items-center gap-2 rounded-md bg-signal px-5 text-sm font-semibold text-ink transition hover:brightness-95"
            >
              Read the papers
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <a
              href="/resume.pdf"
              className="inline-flex min-h-12 items-center gap-2 rounded-md border border-black/15 px-5 text-sm font-medium transition hover:border-fg dark:border-white/20"
            >
              <FileText className="h-4 w-4" aria-hidden />
              Résumé (PDF)
            </a>
          </div>
        </div>

        <figure className="hero-rise relative" style={{ animationDelay: "200ms" }}>
          <div className="relative overflow-hidden rounded-xl bg-ink">
            <Image
              src="/images/hero-intersection.webp"
              alt="Street intersection video frame from UrbanClipAtlas with a dark SUV and a man on a bike tracked by labelled boxes and trajectories"
              width={1100}
              height={619}
              priority
              sizes="(min-width: 1024px) 640px, 100vw"
              className="aspect-[16/9] w-full object-cover"
            />
            {/* Detection brackets + sweep: the recognition motif, now on the scene it was built for. */}
            <span aria-hidden className="pointer-events-none absolute left-3 top-3 h-8 w-8 border-l-2 border-t-2 border-signal" />
            <span aria-hidden className="pointer-events-none absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2 border-signal" />
            <span aria-hidden className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 border-b-2 border-l-2 border-signal" />
            <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 border-b-2 border-r-2 border-signal" />
            <div aria-hidden className="hero-scan pointer-events-none absolute inset-x-3 top-0 h-full">
              <div className="h-px w-full bg-signal/80 shadow-[0_0_10px_rgba(255,90,54,0.6)]" />
            </div>
            <p className="absolute inset-x-4 bottom-4 max-w-md rounded-md bg-ink/80 px-3 py-2 font-mono text-xs leading-relaxed text-paper backdrop-blur-sm sm:inset-x-auto sm:left-5 sm:text-[13px]">
              <span className="text-signal">›</span> {QUERY}
            </p>
          </div>
          <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
            <span>UrbanClipAtlas · CGF / EuroVis 2026</span>
            <span className="flex items-center gap-2">
              matches
              {HITS.map((t) => (
                <span key={t} className="rounded bg-black/5 px-1.5 py-0.5 tabular-nums text-fg dark:bg-white/10">
                  {t}
                </span>
              ))}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
