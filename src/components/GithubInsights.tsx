import { ArrowUpRight, GitFork, Star, Users, FolderGit2 } from "lucide-react";
import { Card } from "./Card";
import { GithubCharts } from "./GithubCharts";
import type { GithubProfile } from "@/lib/github-graphql";

interface GithubInsightsProps {
  profile: GithubProfile;
  repoUrl: string;
  summary: { totalRepos: number; totalStars: number; totalForks: number };
  languagesChart: { name: string; bytes: number; percent: number }[];
  activityPoints: { month: string; count: number }[];
}

const SNAKE_SRC =
  "https://raw.githubusercontent.com/reqhiem/reqhiem/output/snake.svg";
const SNAKE_SCOPE = ".snake-scope";

// Rewrites the SVG's embedded <style> so its `.c` / `.s` / `.u` class selectors
// don't leak to the rest of the page when inlined, and drops the `:root{...}`
// block so our wrapper controls the CSS variables (theme-aware).
const scopeSvgStyles = (css: string, scope: string): string => {
  let out = "";
  let i = 0;
  const n = css.length;
  while (i < n) {
    while (i < n && /\s/.test(css[i])) {
      out += css[i];
      i++;
    }
    if (i >= n) break;

    if (css[i] === "@") {
      // Pass at-rules (incl. @keyframes with nested braces) through untouched.
      const start = i;
      while (i < n && css[i] !== "{") i++;
      let depth = 0;
      while (i < n) {
        if (css[i] === "{") depth++;
        else if (css[i] === "}") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      out += css.slice(start, i);
      continue;
    }

    const selStart = i;
    while (i < n && css[i] !== "{") i++;
    const selectorList = css.slice(selStart, i).trim();

    const ruleStart = i;
    let depth = 0;
    while (i < n) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
      i++;
    }
    const rules = css.slice(ruleStart, i);

    if (selectorList === ":root") continue;

    const prefixed = selectorList
      .split(",")
      .map((s) => `${scope} ${s.trim()}`)
      .join(",");
    out += `${prefixed}${rules}`;
  }
  return out;
};

const loadSnakeSvg = async (): Promise<string | null> => {
  try {
    const res = await fetch(SNAKE_SRC, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    let svg = await res.text();
    svg = svg.replace(
      /<style>([\s\S]*?)<\/style>/,
      (_match, css: string) => `<style>${scopeSvgStyles(css, SNAKE_SCOPE)}</style>`,
    );
    // Drop hardcoded width/height so the SVG scales via its viewBox.
    svg = svg.replace(/<svg\b([^>]*?)\s+width="[^"]*"/, "<svg$1");
    svg = svg.replace(/<svg\b([^>]*?)\s+height="[^"]*"/, "<svg$1");
    return svg;
  } catch {
    return null;
  }
};

export async function GithubInsights({
  profile,
  repoUrl,
  summary,
  languagesChart,
  activityPoints,
}: GithubInsightsProps) {
  const snakeSvg = await loadSnakeSvg();
  const latestActivity = activityPoints.length
    ? activityPoints[activityPoints.length - 1]
    : null;

  const stats: { label: string; value: number; icon: typeof Star }[] = [
    { label: "Repos", value: summary.totalRepos, icon: FolderGit2 },
    { label: "Stars", value: summary.totalStars, icon: Star },
    { label: "Forks", value: summary.totalForks, icon: GitFork },
    { label: "Followers", value: profile.followers, icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Contribution snake — SVG is inlined + scoped so cells inherit
          theme-aware CSS vars from .snake-scope (see globals.css). */}
      {snakeSvg ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted dark:text-white/60">
                Contribution graph
              </p>
              <h3 className="mt-1 text-lg font-semibold">Year at a glance</h3>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted dark:text-white/50">
              updated daily
            </span>
          </div>
          <div
            className="snake-scope relative mt-5 w-full [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            style={{ aspectRatio: "880 / 192" }}
            dangerouslySetInnerHTML={{ __html: snakeSvg }}
          />
        </Card>
      ) : null}

      {/* Profile identity + stats row */}
      <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted dark:text-white/60">
                Profile
              </p>
              <h3 className="mt-1 text-xl font-semibold">
                {profile.name ?? profile.login}
              </h3>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                @{profile.login}
              </p>
            </div>
            <a
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] underline decoration-accent/60 underline-offset-4 transition hover:decoration-accent"
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open
              <ArrowUpRight size={12} />
            </a>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2 text-muted dark:text-white/50">
                  <Icon size={12} />
                  <span className="text-[10px] uppercase tracking-[0.2em]">
                    {label}
                  </span>
                </div>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {latestActivity ? (
            <div className="mt-6 rounded-xl border border-accent/15 bg-accent/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent">
                Latest pulse
              </p>
              <p className="mt-1 text-sm">
                <span className="font-mono text-black/80 dark:text-white/80">
                  {latestActivity.month}
                </span>
                <span className="mx-2 text-black/30 dark:text-white/30">·</span>
                <span className="font-semibold tabular-nums">
                  {latestActivity.count.toLocaleString()}
                </span>
                <span className="ml-1 text-black/60 dark:text-white/60">
                  contributions
                </span>
              </p>
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Languages</h3>
            <p className="text-xs uppercase tracking-[0.2em] text-muted dark:text-white/60">
              Top 6
            </p>
          </div>
          <GithubCharts
            languagesChart={languagesChart}
            activityPoints={activityPoints}
          />
        </Card>
      </div>

    </div>
  );
}
