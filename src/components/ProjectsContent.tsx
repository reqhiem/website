"use client";

import { useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { localizeList } from "@/lib/content";

interface ProjectsContentProps {
  projects: any[];
  types: string[];
  lang: "es" | "en";
}

export function ProjectsContent({ projects, types, lang }: ProjectsContentProps) {
  const [activeType, setActiveType] = useState("all");

  const filteredProjects = activeType === "all" 
    ? projects 
    : projects.filter((p) => p.type === activeType);

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-8">
        <button 
          className={`rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${activeType === "all" ? "bg-black text-white" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
          onClick={() => setActiveType("all")}
        >
          All
        </button>
        {types.map((type) => (
          <button 
            key={type}
            className={`rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${activeType === type ? "bg-black text-white" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
            onClick={() => setActiveType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredProjects.map((project: any, index: number) => (
          <div key={index}>
            <ProjectCard 
              project={{ ...project, highlights: localizeList(project.highlights, lang) }} 
              lang={lang} 
            />
          </div>
        ))}
      </div>
    </>
  );
}
