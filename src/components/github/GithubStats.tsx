import { ArrowUpRight, FolderGit2, GitFork, Star, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "../Card";
import type {
  GithubActivityPoint,
  GithubProfile,
  GithubSummary,
} from "@/lib/github";

interface GithubStatsProps {
  profile: GithubProfile;
  summary: GithubSummary;
  repoUrl: string;
  latest: GithubActivityPoint | null;
}

export function GithubStats({ profile, summary, repoUrl, latest }: GithubStatsProps) {
  const stats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "Repos", value: summary.totalRepos, icon: FolderGit2 },
    { label: "Stars", value: summary.totalStars, icon: Star },
    { label: "Forks", value: summary.totalForks, icon: GitFork },
    { label: "Followers", value: profile.followers, icon: Users },
  ];

  return (
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
              <span className="text-[10px] uppercase tracking-[0.2em]">{label}</span>
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {latest ? (
        <div className="mt-6 rounded-xl border border-accent/15 bg-accent/5 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent">
            Latest pulse
          </p>
          <p className="mt-1 text-sm">
            <span className="font-mono text-black/80 dark:text-white/80">
              {latest.month}
            </span>
            <span className="mx-2 text-black/30 dark:text-white/30">·</span>
            <span className="font-semibold tabular-nums">
              {latest.count.toLocaleString()}
            </span>
            <span className="ml-1 text-black/60 dark:text-white/60">
              contributions
            </span>
          </p>
        </div>
      ) : null}
    </Card>
  );
}
