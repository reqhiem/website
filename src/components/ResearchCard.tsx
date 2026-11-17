import Image from "next/image";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Link2,
  MonitorPlay,
  Play,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "./Badge";

interface ResearchLink {
  label: string;
  url: string;
}

interface ResearchCardProps {
  project: {
    title: string;
    summary?: string;
    description?: string;
    role?: string;
    stack: string[];
    status: string;
    authors?: string[];
    venue?: string | null;
    year?: string | null;
    presentedAt?: string | null;
    links?: ResearchLink[];
    image?: { src: string; width: number; height: number; alt: string } | null;
  };
  priority?: boolean;
}

const AUTHOR_NAME = "Joel Perca";
// Artifacts a reader opens get buttons; identifiers (DOI, arXiv, page) stay quiet links.
const PRIMARY = ["pdf", "video", "code", "demo"];

function iconForLink(label: string): LucideIcon {
  const key = label.toLowerCase();
  if (key.includes("doi")) return Link2;
  if (key.includes("arxiv")) return BookOpen;
  if (key.includes("pdf")) return FileText;
  if (key.includes("video")) return Play;
  if (key.includes("demo")) return MonitorPlay;
  if (key.includes("code")) return Github;
  if (key.includes("page")) return Globe;
  return ExternalLink;
}

export function ResearchCard({ project, priority = false }: ResearchCardProps) {
  const { title, summary, description, role, status, venue, year, presentedAt, image } = project;
  const authors = project.authors ?? [];
  const links = project.links ?? [];
  const primary = links.filter((l) => PRIMARY.includes(l.label.toLowerCase()));
  const secondary = links.filter((l) => !PRIMARY.includes(l.label.toLowerCase()));
  const page = links.find((l) => l.label.toLowerCase().includes("page"))?.url ?? links[0]?.url;
  // Venue strings usually already carry the year ("… EuroVis 2026").
  const citation = [venue, year && venue?.includes(year) ? null : year].filter(Boolean).join(" · ");

  return (
    <article className="surface grid gap-6 p-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-8 md:p-6">
      {image ? (
        <a
          href={page}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block self-start overflow-hidden rounded-lg border border-black/10 bg-white dark:border-white/10"
          aria-label={`${title}: project page`}
        >
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt={image.alt}
            priority={priority}
            sizes="(min-width: 1152px) 440px, (min-width: 768px) 40vw, 100vw"
            className="aspect-[16/10] w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        </a>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3">
        <p className="font-mono text-xs leading-relaxed text-muted">{citation}</p>
        <h3 className="text-xl font-semibold leading-snug md:text-2xl">{title}</h3>

        {authors.length ? (
          <p className="text-sm leading-relaxed text-muted">
            {authors.map((author, index) => (
              <span key={`${author}-${index}`}>
                {index > 0 ? ", " : ""}
                {author === AUTHOR_NAME ? (
                  <strong className="font-semibold text-fg underline decoration-signal decoration-2 underline-offset-4">
                    {author}
                  </strong>
                ) : (
                  author
                )}
              </span>
            ))}
          </p>
        ) : null}

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {role ? <span className="font-medium text-accent">{role}</span> : null}
          {status ? <span>{status}</span> : null}
          {presentedAt ? <span>{presentedAt}</span> : null}
        </p>

        {/* Fixed 3-line summary keeps every card the same rhythm; the full
            abstract stays one click away. */}
        {summary ? (
          <p className="line-clamp-3 font-serif text-base leading-relaxed text-fg/85">{summary}</p>
        ) : null}

        {description ? (
          <details className="group text-sm">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
              <span className="transition-transform group-open:rotate-90">›</span> Abstract
            </summary>
            <p className="mt-1 font-serif text-base leading-relaxed text-fg/85">{description}</p>
          </details>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {primary.map((link) => {
            const Icon = iconForLink(link.label);
            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-black/15 px-3 text-sm font-medium transition-colors hover:border-fg dark:border-white/20"
              >
                <Icon size={15} className="shrink-0" aria-hidden />
                {link.label}
              </a>
            );
          })}
          {secondary.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center px-2 text-sm text-muted underline decoration-black/20 underline-offset-4 hover:text-fg dark:decoration-white/25"
            >
              {link.label}
            </a>
          ))}
        </div>

        {project.stack.length ? (
          <div className="flex flex-wrap gap-1.5">
            {project.stack.map((item) => (
              <Badge key={item} label={item} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
