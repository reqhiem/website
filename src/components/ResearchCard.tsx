import { Sparkles } from "lucide-react";
import { Badge } from "./Badge";
import { Card } from "./Card";

interface ResearchCardProps {
  project: {
    title: string;
    descriptionEs?: string;
    descriptionEn?: string;
    roleEs?: string;
    roleEn?: string;
    stack: string[];
    status: string;
  };
  lang: "es" | "en";
}

export function ResearchCard({ project, lang }: ResearchCardProps) {
  const description = lang === "es" ? project.descriptionEs : project.descriptionEn;
  const role = lang === "es" ? project.roleEs : project.roleEn;

  return (
    <Card className="flex h-full flex-col gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
          {role}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Sparkles size={18} className="text-[color:var(--color-accent)]" />
          <h3 className="text-xl font-semibold">{project.title}</h3>
        </div>
      </div>
      <p className="text-sm text-black/70 dark:text-white/70">{description}</p>
      <div className="flex flex-wrap gap-2">
        {project.stack.map((item) => (
          <Badge key={item} label={item} />
        ))}
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
        Status: {project.status}
      </p>
    </Card>
  );
}
