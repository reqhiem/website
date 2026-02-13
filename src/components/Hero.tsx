"use client";

import { Sparkles, ArrowUpRight, Link2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface HeroProps {
  person: any;
  site: any;
  insights: any;
  lang: "es" | "en";
}

export function Hero({ person, site, insights, lang }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = containerRef.current?.querySelectorAll("[data-gsap-item]");
      if (items) {
        gsap.from(items, {
          y: 16,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const tagline = lang === "es" ? site.tagline_es : site.tagline_en;
  const headline = lang === "es" ? person.headline_es : person.headline_en;
  const bullets = lang === "es" ? insights.hero_bullets_es : insights.hero_bullets_en;
  const ctaPrimary = lang === "es" ? site.ui.cta_primary.label_es : site.ui.cta_primary.label_en;
  const ctaSecondary = lang === "es" ? site.ui.cta_secondary.label_es : site.ui.cta_secondary.label_en;

  const withLang = (href: string) => {
    if (href.startsWith("http") || href.startsWith("/assets")) return href;
    // Next.js handles routing, but if it's external or asset, keep as is.
    // If it's an internal link, next/link or next-intl/link handles it.
    // However, the original code added /es prefix manually.
    // In next-intl, Link handles this. But here it's href in <a> tag or Link.
    // If I use Next's Link, I don't need to add prefix manually if I use next-intl Link.
    // But `site.ui.cta_primary.href` is likely `/projects`.
    return href;
  };

  const ctaPrimaryHref = withLang(site.ui.cta_primary.href);
  const ctaSecondaryHref = withLang(site.ui.cta_secondary.href);

  // Note: Using standard <a> tag for external or potentially asset links, 
  // but if internal I should use Link. 
  // Assuming these are internal main nav links, I'll use Link from next-intl if possible, 
  // but standard <a> works too, just full reload. 
  // I'll use Link from next-intl for best SPA feel.
  // Actually I need to import Link.
  
  return (
    <section className="border-b border-black/5 py-20 dark:border-white/10">
      <div 
        ref={containerRef}
        className="container-page grid gap-10 lg:grid-cols-[1.3fr_0.7fr]" 
        data-gsap="hero"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] dark:text-white/60" data-gsap-item>
            {headline}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl" data-gsap-item>
            {person.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-black/70 dark:text-white/70" data-gsap-item>{tagline}</p>
          <div className="mt-6 flex flex-wrap gap-4" data-gsap-item>
            <a
              className="rounded-full bg-[color:var(--color-accent)] px-6 py-3 text-sm font-semibold text-white"
              href={ctaPrimaryHref}
            >
              <span className="inline-flex items-center gap-2">
                <ArrowUpRight size={16} />
                {ctaPrimary}
              </span>
            </a>
            <a
              className="rounded-full border border-black/15 px-6 py-3 text-sm font-semibold text-black/80 transition hover:border-black/40 dark:border-white/20 dark:text-white/80"
              href={ctaSecondaryHref}
            >
              <span className="inline-flex items-center gap-2">
                <Link2 size={16} />
                {ctaSecondary}
              </span>
            </a>
          </div>
        </div>
        <div className="surface p-6" data-gsap-item>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
            {lang === "es" ? "Foco" : "Focus"}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-black/70 dark:text-white/70">
            {bullets.map((bullet: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <Sparkles size={16} className="mt-0.5 text-[color:var(--color-accent)]" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
