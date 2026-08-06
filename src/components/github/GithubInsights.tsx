import { Card } from "../Card";
import { ActivityPulse } from "./ActivityPulse";
import { ContributionGraph } from "./ContributionGraph";
import { GithubStats } from "./GithubStats";
import { LanguageDonut } from "./LanguageDonut";
import { loadSnakeSvg } from "@/lib/github-snake";
import type { GithubInsightsData } from "@/lib/github";

interface GithubInsightsProps {
  username: string;
  repoUrl: string;
  insights: GithubInsightsData;
}

export async function GithubInsights({
  username,
  repoUrl,
  insights,
}: GithubInsightsProps) {
  const { profile, summary, languagesChart, activityPoints } = insights;
  const snakeSvg = await loadSnakeSvg(username);
  const latest = activityPoints.length
    ? activityPoints[activityPoints.length - 1]
    : null;

  return (
    <div className="space-y-6">
      {snakeSvg ? <ContributionGraph svg={snakeSvg} /> : null}

      <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
        <GithubStats
          profile={profile}
          summary={summary}
          repoUrl={repoUrl}
          latest={latest}
        />

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Languages</h3>
            <p className="text-xs uppercase tracking-[0.2em] text-muted dark:text-white/60">
              Top 6
            </p>
          </div>
          <LanguageDonut languages={languagesChart} />
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold">Activity pulse</h3>
        <ActivityPulse points={activityPoints} />
      </Card>
    </div>
  );
}
