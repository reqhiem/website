import {
  getPerson,
  getSkills,
  getCertifications,
  getLanguages,
} from "@/lib/content";
import { fetchGithubInsights, getGithubUsername } from "@/lib/github";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { GithubInsights } from "@/components/github/GithubInsights";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// 6h ISR. Must be a literal - Next requires this segment config value to be
// statically analyzable, so it cannot import a shared constant.
export const revalidate = 21600;

export default async function AboutPage() {
  const person = getPerson();
  const skills = getSkills();
  const certifications = getCertifications();
  const languages = getLanguages();
  const summary = person.summary;

  const githubLink = person.links.find((link) => link.label.toLowerCase().includes("github"));
  const githubUsername =
    (process.env.GITHUB_USERNAME as string | undefined) ??
    getGithubUsername(githubLink?.url) ??
    "reqhiem";
  const githubToken = process.env.GITHUB_TOKEN as string | undefined;
  const githubRepoUrl = `https://github.com/${githubUsername}`;

  const insights = await fetchGithubInsights({
    username: githubUsername,
    token: githubToken,
    months: 6,
  });

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Section title="About" subtitle="Profile">
          <Card>
            <p className="text-lg text-black/70 dark:text-white/70">{summary}</p>
          </Card>
        </Section>

        <Section title="What I do" subtitle="Differentiators">
          <div className="grid gap-6 md:grid-cols-3">
            {person.positioning.differentiators.map((item, index) => (
              <Card key={index}>
                <p className="text-sm text-black/70 dark:text-white/70">{item}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="GitHub insights" subtitle="General activity signal">
          <GithubInsights
            username={githubUsername}
            repoUrl={githubRepoUrl}
            insights={insights}
          />
        </Section>

        <Section title="Skills" subtitle="Capabilities">
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(skills).map(([category, items]) => (
              <Card key={category}>
                <p className="text-xs uppercase tracking-[0.2em] text-muted dark:text-white/60">
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

        <Section title="Languages & certifications" subtitle="Credentials">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold">Languages</h3>
              <ul className="mt-4 space-y-2 text-sm text-black/70 dark:text-white/70">
                {languages.map((item) => (
                  <li key={item.name}>{item.name} · {item.level}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold">Certifications</h3>
              <ul className="mt-4 space-y-2 text-sm text-black/70 dark:text-white/70">
                {certifications.map((item) => (
                  <li key={item.name}>{item.name}</li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
