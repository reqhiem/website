import {
  BookOpen,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Link2,
  MapPin,
  Play,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "./Badge";
import { Card } from "./Card";

interface ResearchLink {
  label: string;
  url: string;
}

interface ResearchCardProps {
  project: {
    title: string;
    description?: string;
    role?: string;
    stack: string[];
    status: string;
    authors?: string[];
    venue?: string | null;
    year?: string | null;
    doi?: string | null;
    presentedAt?: string | null;
    links?: ResearchLink[];
  };
}

const AUTHOR_NAME = "Joel Perca";

function iconForLink(label: string): LucideIcon {
  const key = label.toLowerCase();
  if (key.includes("doi")) return Link2;
  if (key.includes("arxiv")) return BookOpen;
  if (key.includes("pdf") || key.includes("paper")) return FileText;
  if (key.includes("video") || key.includes("talk")) return Play;
  if (key.includes("code") || key.includes("github")) return Github;
  if (key.includes("page") || key.includes("site")) return Globe;
  return ExternalLink;
}

export function ResearchCard({ project }: ResearchCardProps) {
  const { title, description, role, status, venue, year, presentedAt } = project;
  const authors = project.authors ?? [];
  const links = project.links ?? [];
  const stack = project.stack ?? [];
  // Venue strings already carry the year ("… Proc. EuroVis 2026"), so only
  // append it when it is not already there.
  const eyebrow = [venue, year && venue?.includes(year) ? null : year]
    .filter(Boolean)
    .join(" · ");
  const meta = [role, status].filter(Boolean).join(" · ");

  return (
    <Card className="flex h-full flex-col gap-4">
      <div>
        {eyebrow ? (
          // Not uppercase/wide-tracked: this holds a full citation string
          // ("Computer Graphics Forum, vol. 45, no. 3 (Proc. EuroVis 2026)"),
          // which is unreadable at 0.2em tracking inside a half-width card.
          <p className="text-xs leading-relaxed text-muted dark:text-white/60">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="mt-2 text-xl font-semibold leading-snug">{title}</h3>
      </div>

      {authors.length ? (
        <p className="text-xs leading-relaxed text-black/55 dark:text-white/55">
          {authors.map((author, index) => (
            <span key={`${author}-${index}`}>
              {index > 0 ? ", " : ""}
              {author === AUTHOR_NAME ? (
                <strong className="font-semibold text-accent">{author}</strong>
              ) : (
                author
              )}
            </span>
          ))}
        </p>
      ) : null}

      {description ? (
        <p className="text-sm text-black/70 dark:text-white/70">{description}</p>
      ) : null}

      {presentedAt ? (
        <p className="flex items-start gap-2 text-xs text-black/60 dark:text-white/60">
          <MapPin size={14} className="mt-0.5 shrink-0 text-accent" />
          <span>{presentedAt}</span>
        </p>
      ) : null}

      {stack.length ? (
        <div className="flex flex-wrap gap-2">
          {stack.map((item) => (
            <Badge key={item} label={item} />
          ))}
        </div>
      ) : null}

      {meta || links.length ? (
        <div className="mt-auto flex flex-col gap-3 pt-1">
          {meta ? (
            <p className="text-xs uppercase tracking-[0.2em] text-muted dark:text-white/60">
              {meta}
            </p>
          ) : null}
          {links.length ? (
            <div className="flex flex-wrap gap-2">
              {links.map((link) => {
                const Icon = iconForLink(link.label);
                return (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/70 transition-colors hover:border-accent hover:text-accent dark:border-white/15 dark:text-white/70 dark:hover:border-accent"
                  >
                    <Icon size={13} className="shrink-0" />
                    {link.label}
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
