import {
  getPerson,
  getSkills,
  getCertifications,
  getLanguages,
  localizeList,
  type Language
} from "@/lib/content";
import { getGithubUsername } from "@/lib/github";
import { fetchGithubInsights } from "@/lib/github-graphql";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { GithubInsights } from "@/components/GithubInsights";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale as Language;

  const person = getPerson();
  const skills = getSkills();
  const certifications = getCertifications();
  const languages = getLanguages();
  const summary = lang === "es" ? person.summary_es : person.summary_en;

  const githubLink = person.links.find((link) => link.label.toLowerCase().includes("github"));
  const githubUsername =
    (process.env.GITHUB_USERNAME as string | undefined) ??
    getGithubUsername(githubLink?.url) ??
    "reqhiem";
  const githubToken = process.env.GITHUB_TOKEN as string | undefined;
  const githubRepoUrl = `https://github.com/${githubUsername}`;

  // Next.js data fetching is deduped automatically for fetch requests, but here fetchGithubInsights calls fetch.
  // It's safe to call in Server Component.
  const insights = await fetchGithubInsights({ username: githubUsername, token: githubToken, months: 6 });

  return (
    <>
      <Navbar lang={lang} />
      <main className="min-h-[70vh]">
        <Section title={lang === "es" ? "Sobre mí" : "About"} subtitle={lang === "es" ? "Perfil" : "Profile"}>
          <Card>
            <p className="text-lg text-black/70 dark:text-white/70">{summary}</p>
          </Card>
        </Section>

        <Section title={lang === "es" ? "Lo que hago" : "What I do"} subtitle={lang === "es" ? "Diferenciadores" : "Differentiators"}>
          <div className="grid gap-6 md:grid-cols-3">
            {localizeList(person.positioning.differentiators, lang).map((item, index) => (
              <Card key={index}>
                <p className="text-sm text-black/70 dark:text-white/70">{item}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={lang === "es" ? "Insights de GitHub" : "GitHub insights"} subtitle={lang === "es" ? "Señal de actividad" : "General activity signal"}>
          <GithubInsights
            profile={insights.profile}
            repoUrl={githubRepoUrl}
            languagesChart={insights.languagesChart}
            activityPoints={insights.activityPoints}
            summary={insights.summary}
            labels={{
              repoLabel: "Profile",
              totalReposLabel: "Total repos",
              totalStarsLabel: "Total stars",
              totalForksLabel: "Total forks",
              followersLabel: "Followers",
              languagesLabel: "Languages",
              topLabel: "Top 6",
              noLanguages: "Language data unavailable.",
              noActivity: "Activity data unavailable.",
              activityLabel: "Activity pulse",
              activityHelper: "Last 6 months · contributions",
            }}
          />
        </Section>

        <Section title={lang === "es" ? "Habilidades" : "Skills"} subtitle={lang === "es" ? "Capacidades" : "Capabilities"}>
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(skills).map(([category, items]) => (
              <Card key={category}>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
                  {category}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(items as string[]).map((item) => (
                    <Badge key={item} label={item} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={lang === "es" ? "Idiomas y certificaciones" : "Languages & certifications"} subtitle={lang === "es" ? "Credenciales" : "Credentials"}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold">{lang === "es" ? "Idiomas" : "Languages"}</h3>
              <ul className="mt-4 space-y-2 text-sm text-black/70 dark:text-white/70">
                {languages.map((item) => (
                  <li key={item.name}>{item.name} · {item.level}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold">{lang === "es" ? "Certificaciones" : "Certifications"}</h3>
              <ul className="mt-4 space-y-2 text-sm text-black/70 dark:text-white/70">
                {certifications.map((item) => (
                  <li key={item.name}>{item.name}</li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
