import site from "../content/site.json";

export type Language = "es" | "en";

export type SiteData = typeof site;

export const getSite = () => site.site;
export const getPerson = () => site.person;
export const getEducation = () => site.education;
export const getResearch = () => site.research;
export const getProjects = () => site.projects;
export const getAwards = () => site.awards;
export const getCertifications = () => site.certifications;
export const getLanguages = () => site.languages;
export const getSkills = () => site.skills;
export const getInsights = () => site.insights_for_copy;

export const getRoutes = (lang: Language) =>
  site.site.routes.map((route) => ({
    path: route.path,
    label: lang === "es" ? route.label_es : route.label_en,
  }));

export const getExperienceSorted = () => {
  const copy = [...site.experience];
  return copy.sort((a, b) => {
    const aEnd = a.end ?? "9999-12";
    const bEnd = b.end ?? "9999-12";
    if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
    return b.start.localeCompare(a.start);
  });
};

export const getFeaturedProjects = () =>
  site.projects.filter((project) => project.featured);

export const getFeaturedResearch = () =>
  site.research.projects.slice(0, 2);

export const getPrimaryEmail = () =>
  site.person.emails.find((email) => email.primary)?.value ??
  site.person.emails[0]?.value ??
  "hello@example.com";

export const getLocalized = <T extends { _es?: string; _en?: string }>(
  base: T,
  lang: Language,
  key: keyof T
) => {
  const value = base[key];
  return typeof value === "string" ? value : "";
};

export const getText = (valueEs: string, valueEn: string, lang: Language) =>
  lang === "es" ? valueEs : valueEn;

const enMap: Record<string, string> = {
  "Puente fuerte entre investigación (papers/sistemas) y delivery de producto (CRM/ERP, automatizaciones).":
    "Strong bridge between research (papers/systems) and product delivery (CRM/ERP, automation).",
  "Experiencia con stacks modernos + despliegue (Docker/K8s, CI/CD).":
    "Experience with modern stacks and deployment (Docker/K8s, CI/CD).",
  "Liderazgo técnico y ownership end-to-end (arquitectura, implementación, UI, despliegue).":
    "Technical leadership and end-to-end ownership (architecture, implementation, UI, deployment).",
  "Liderazgo técnico en automatizaciones (chatbot conversacional para atención vía WhatsApp).":
    "Technical leadership in automations (conversational chatbot for WhatsApp support).",
  "Gestión/control de infraestructura y arquitectura (Website, LMS, CRM, ERP, automatizaciones).":
    "Infrastructure and architecture management (website, LMS, CRM, ERP, automations).",
  "Implementación de ERP/CRM: Django REST Framework, React, Docker Compose.":
    "ERP/CRM implementation: Django REST Framework, React, Docker Compose.",
  "Limpieza/procesamiento de datos históricos para segmentación de prospectos.":
    "Cleaning/processing historical data for prospect segmentation.",
  "Automatización de procesos de negocio (No/Low Code).":
    "Business process automation (no/low-code).",
  "Soporte y capacitación interna sobre herramientas.":
    "Internal support and training on tools.",
  "Implementación de APIs REST y revisiones de código.":
    "Implemented REST APIs and performed code reviews.",
  "Optimización en estela-cli para mejores subidas en redes lentas.":
    "Optimized estela-cli for better uploads on slow networks.",
  "Arquitectura basada en microservicios con criterios de escalamiento.":
    "Microservices-based architecture with scaling criteria.",
  "Despliegue en Google Cloud Platform con CI/CD.":
    "Deployment on Google Cloud Platform with CI/CD.",
  "Culminación del programa en un año; aceptado al PhD.":
    "Completed the program in one year; admitted to the PhD.",
  "Cursos: Machine Learning, Deep Learning (PyTorch/HuggingFace), Reinforcement Learning.":
    "Courses: Machine Learning, Deep Learning (PyTorch/HuggingFace), Reinforcement Learning.",
  "2do lugar de promoción.":
    "2nd in class.",
  "Cursos: IA, Tópicos Avanzados de IA, Cloud Computing.":
    "Courses: AI, Advanced AI Topics, Cloud Computing.",
};

export const localizeText = (text: string, lang: Language) => {
  if (lang === "es") return text;
  return enMap[text] ?? text;
};

export const localizeList = (items: string[], lang: Language) =>
  items.map((item) => localizeText(item, lang));

export const formatDateRange = (
  start: string,
  end: string | null,
  lang: Language
) => {
  const endLabel = lang === "es" ? "Actualidad" : "Present";
  return `${start} — ${end ?? endLabel}`;
};

export const buildCanonical = (path: string) => {
  const domain = site.site.domain.replace(/\/$/, "");
  return `https://${domain}${path}`;
};

export const getSeoDescription = (lang: Language) =>
  lang === "es" ? site.site.seo.description_es : site.site.seo.description_en;
