import { Card } from "./Card";
import { GithubCharts } from "./GithubCharts";

interface GithubInsightsProps {
  profile: { login: string; name?: string | null; followers: number };
  repoUrl: string;
  languagesChart: { name: string; bytes: number; percent: number }[];
  activityPoints: { month: string; count: number }[];
  summary: { totalRepos: number; totalStars: number; totalForks: number };
  labels: {
    repoLabel: string;
    totalReposLabel: string;
    totalStarsLabel: string;
    totalForksLabel: string;
    languagesLabel: string;
    topLabel: string;
    noLanguages: string;
    noActivity: string;
    followersLabel: string;
    activityLabel: string;
    activityHelper: string;
  };
}

export function GithubInsights({
  profile,
  repoUrl,
  languagesChart,
  activityPoints,
  summary,
  labels,
}: GithubInsightsProps) {
  const latestActivity = activityPoints.length ? activityPoints[activityPoints.length - 1] : null;

  return (
    <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
              {labels.repoLabel}
            </p>
            <h3 className="text-xl font-semibold">{profile.name ?? profile.login}</h3>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">
              @{profile.login}
            </p>
          </div>
          <a className="text-xs uppercase tracking-[0.2em] underline" href={repoUrl} target="_blank" rel="noreferrer">
            Open
          </a>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
                {labels.totalReposLabel}
              </p>
              <p className="text-2xl font-semibold">{summary.totalRepos}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
                {labels.totalStarsLabel}
              </p>
              <p className="text-2xl font-semibold">{summary.totalStars}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
                {labels.totalForksLabel}
              </p>
              <p className="text-2xl font-semibold">{summary.totalForks}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
                {labels.followersLabel}
              </p>
              <p className="text-2xl font-semibold">{profile.followers}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-black/70 dark:text-white/70">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
            Activity snapshot
          </p>
          <p className="mt-2">
            {latestActivity
              ? `${latestActivity.month} · ${latestActivity.count} contributions`
              : "No recent activity data available."}
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{labels.languagesLabel}</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
            {labels.topLabel}
          </p>
        </div>
        <GithubCharts
          languagesChart={languagesChart}
          activityPoints={activityPoints}
          labels={{ 
            noLanguages: labels.noLanguages, 
            noActivity: labels.noActivity, 
            activityLabel: labels.activityLabel, 
            activityHelper: labels.activityHelper 
          }}
        />
      </Card>
    </div>
  );
}
