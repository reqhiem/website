import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "./Badge";

interface ProjectCardProps {
  project: {
    name: string;
    type: string;
    role?: string | null;
    oneLiner?: string;
    stack: string[];
    highlights?: string[];
    links?: { label: string; url: string }[];
    image?: { src: string; width: number; height: number; alt: string } | null;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { name, type, role, oneLiner, image } = project;
  const links = project.links ?? [];
  const href = links[0]?.url;

  return (
    <article className="surface flex h-full flex-col overflow-hidden">
      {image ? (
        <a href={href} target="_blank" rel="noopener noreferrer" tabIndex={-1} className="group block border-b border-black/10 bg-white dark:border-white/10">
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt={image.alt}
            sizes="(min-width: 768px) 560px, 100vw"
            className="aspect-[16/10] w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        </a>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <p className="font-mono text-xs text-muted">
          {[type, role].filter(Boolean).join(" · ")}
        </p>
        <h3 className="text-2xl font-semibold">{name}</h3>
        {oneLiner ? <p className="text-fg/85">{oneLiner}</p> : null}
        {project.highlights?.length ? (
          <ul className="space-y-1.5 text-sm text-muted">
            {project.highlights.map((highlight) => (
              <li key={highlight} className="relative pl-4 before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-signal">
                {highlight}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((item) => (
            <Badge key={item} label={item} />
          ))}
        </div>
        {links.length ? (
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1 text-sm font-medium underline decoration-black/20 underline-offset-4 hover:decoration-signal dark:decoration-white/25"
              >
                {link.label}
                <ArrowUpRight size={14} aria-hidden />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
