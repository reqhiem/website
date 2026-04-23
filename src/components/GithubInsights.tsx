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

const SNAKE_SRC = "https://raw.githubusercontent.com/reqhiem/reqhiem/output/snake.svg";

export function GithubInsights({
  profile,
  repoUrl,
  summary,
  languagesChart,
  activityPoints,
}: GithubInsightsProps) {
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
      {/* Contribution snake — dark card to match the SVG's hardcoded GitHub-dark palette */}
      <Card className="overflow-hidden !bg-[#0d1117] !border-white/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Contribution graph
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              Year at a glance
            </h3>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            updated daily
          </span>
        </div>
        <div
          className="relative mt-5 w-full"
          style={{ aspectRatio: "880 / 192" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SNAKE_SRC}
            alt="GitHub contribution graph rendered as a snake"
            loading="lazy"
            className="absolute inset-0 h-full w-full"
            width={880}
            height={192}
          />
        </div>
      </Card>

      {/* Profile identity + stats row */}
      <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
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
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] underline decoration-[color:var(--color-accent)]/60 underline-offset-4 transition hover:decoration-[color:var(--color-accent)]"
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
                <div className="flex items-center gap-2 text-[color:var(--color-muted)] dark:text-white/50">
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
            <div className="mt-6 rounded-xl border border-[color:var(--color-accent)]/15 bg-[color:var(--color-accent)]/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
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
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
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
