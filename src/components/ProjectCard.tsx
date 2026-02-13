import { Layers } from "lucide-react";
import { Badge } from "./Badge";
import { Card } from "./Card";

interface ProjectCardProps {
  project: {
    name: string;
    type: string;
    oneLinerEs?: string;
    oneLinerEn?: string;
    featured?: boolean;
    stack: string[];
    highlights?: string[];
  };
  lang: "es" | "en";
}

export function ProjectCard({ project, lang }: ProjectCardProps) {
  const description = lang === "es" ? project.oneLinerEs : project.oneLinerEn;

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
            {project.type}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Layers size={18} className="text-[color:var(--color-accent)]" />
            <h3 className="text-xl font-semibold">{project.name}</h3>
          </div>
        </div>
        {project.featured ? (
          <span className="rounded-full bg-[color:var(--color-accent)] px-2 py-1 text-xs uppercase tracking-[0.2em] text-white">
            Featured
          </span>
        ) : null}
      </div>
      <p className="text-sm text-black/70 dark:text-white/70">{description}</p>
      <div className="flex flex-wrap gap-2">
        {project.stack.map((item) => (
          <Badge key={item} label={item} />
        ))}
      </div>
      {project.highlights?.length ? (
        <ul className="mt-2 list-disc pl-4 text-sm text-black/70 dark:text-white/70">
          {project.highlights.map((highlight, index) => (
            <li key={index}>{highlight}</li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
