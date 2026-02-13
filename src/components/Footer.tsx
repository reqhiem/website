import { getPerson, getSite } from "@/lib/content";

interface FooterProps {
  lang: "es" | "en";
}

export function Footer({ lang }: FooterProps) {
  const person = getPerson();
  const site = getSite();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/5 py-10 text-sm dark:border-white/10">
      <div className="container-page flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="uppercase tracking-[0.2em] text-xs">{person.name}</p>
          <p className="opacity-70">
            {lang === "es" ? "Construido con Next.js + Tailwind" : "Built with Next.js + Tailwind"} · {year}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {person.links.map((link) => (
            <a 
              key={link.label}
              className="opacity-70 transition hover:opacity-100" 
              href={link.url} 
              target="_blank" 
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
          <a className="opacity-70 transition hover:opacity-100" href={`https://${site.domain}`}>
            {site.domain}
          </a>
        </div>
      </div>
    </footer>
  );
}
