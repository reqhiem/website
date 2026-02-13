export type GithubProfile = {
  login: string;
  name?: string | null;
  followers: number;
};

export type GithubRepoSummary = {
  name: string;
  url: string;
  stars: number;
  forks: number;
  pushedAt: string;
  isPrivate: boolean;
  languages: { name: string; size: number }[];
};

export type GithubInsightsData = {
  profile: GithubProfile;
  summary: { totalRepos: number; totalStars: number; totalForks: number };
  topRepos: { name: string; url: string; stars: number }[];
  recentRepos: { name: string; url: string; pushed_at: string }[];
  languagesChart: { name: string; bytes: number; percent: number }[];
  activityPoints: { month: string; count: number }[];
};

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

const emptyInsights = (login = "reqhiem"): GithubInsightsData => ({
  profile: { login, name: login, followers: 0 },
  summary: { totalRepos: 0, totalStars: 0, totalForks: 0 },
  topRepos: [],
  recentRepos: [],
  languagesChart: [],
  activityPoints: [],
});

export const fetchGithubInsights = async ({
  username,
  token,
  months = 6,
}: {
  username: string;
  token?: string;
  months?: number;
}): Promise<GithubInsightsData> => {
  if (!username || !token) return emptyInsights(username);

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
  const to = now.toISOString();

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        login
        name
        followers { totalCount }
        repositories(first: 50, ownerAffiliations: OWNER, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
          totalCount
          nodes {
            name
            url
            stargazerCount
            forkCount
            pushedAt
            isPrivate
            languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
              edges { size node { name } }
            }
          }
        }
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays { date contributionCount }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { login: username, from, to },
      }),
    });

    if (!response.ok) return emptyInsights(username);
    const json = await response.json();
    const user = json?.data?.user;
    if (!user) return emptyInsights(username);

    const reposAll: GithubRepoSummary[] = (user.repositories?.nodes ?? []).map((repo: any) => ({
      name: repo.name,
      url: repo.url,
      stars: repo.stargazerCount ?? 0,
      forks: repo.forkCount ?? 0,
      pushedAt: repo.pushedAt ?? "",
      isPrivate: repo.isPrivate ?? false,
      languages:
        repo.languages?.edges?.map((edge: any) => ({
          name: edge.node.name,
          size: edge.size,
        })) ?? [],
    }));

    const summary = {
      totalRepos: reposAll.length,
      totalStars: reposAll.reduce((acc, repo) => acc + repo.stars, 0),
      totalForks: reposAll.reduce((acc, repo) => acc + repo.forks, 0),
    };

    const topRepos: { name: string; url: string; stars: number }[] = [];
    const recentRepos: { name: string; url: string; pushed_at: string }[] = [];

    const languageTotals: Record<string, number> = {};
    reposAll.forEach((repo) => {
      repo.languages.forEach((lang) => {
        languageTotals[lang.name] = (languageTotals[lang.name] ?? 0) + lang.size;
      });
    });
    const totalBytes = Object.values(languageTotals).reduce((acc, value) => acc + value, 0);
    const languagesChart = Object.entries(languageTotals)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percent: totalBytes ? Math.round((bytes / totalBytes) * 100) : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 6);

    const activityMap = new Map<string, number>();
    for (let i = 0; i < months; i += 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = month.toISOString().slice(0, 7);
      activityMap.set(key, 0);
    }

    const days = user.contributionsCollection?.contributionCalendar?.weeks
      ?.flatMap((week: any) => week.contributionDays) ?? [];
    days.forEach((day: any) => {
      const key = day.date.slice(0, 7);
      if (activityMap.has(key)) {
        activityMap.set(key, (activityMap.get(key) ?? 0) + day.contributionCount);
      }
    });

    const activityPoints = Array.from(activityMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      profile: {
        login: user.login,
        name: user.name,
        followers: user.followers?.totalCount ?? 0,
      },
      summary,
      topRepos,
      recentRepos,
      languagesChart,
      activityPoints,
    };
  } catch {
    return emptyInsights(username);
  }
};
