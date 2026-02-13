"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  id?: string;
}

export function Section({ title, subtitle, children, id }: SectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = section.querySelectorAll("[data-gsap-item]");
            gsap.from(items, {
              y: 20,
              opacity: 0,
              duration: 0.8,
              stagger: 0.08,
              ease: "power3.out",
              clearProps: "all" 
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id={id} className="py-16">
      <div className="container-page">
        {title ? (
          <div className="mb-10" data-gsap-item>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] dark:text-white/60">
              {subtitle ?? ""}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
          </div>
        ) : null}
        <div data-gsap-item>
          {children}
        </div>
      </div>
    </section>
  );
}
