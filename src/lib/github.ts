export type GithubProfile = {
  login: string;
  name?: string | null;
  followers: number;
};

export type GithubSummary = {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
};

export type GithubLanguageSlice = {
  name: string;
  bytes: number;
  percent: number;
};

export type GithubActivityPoint = {
  month: string;
  count: number;
};

export type GithubInsightsData = {
  profile: GithubProfile;
  summary: GithubSummary;
  languagesChart: GithubLanguageSlice[];
  activityPoints: GithubActivityPoint[];
};

/** Shared cache window for every GitHub-backed fetch on /about. */
export const GITHUB_REVALIDATE_SECONDS = 21_600;

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

export const getGithubUsername = (url?: string) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("github.com")) return null;
    const [username] = parsed.pathname.split("/").filter(Boolean);
    return username ?? null;
  } catch {
    return null;
  }
};

type GithubRepoSummary = {
  name: string;
  url: string;
  stars: number;
  forks: number;
  pushedAt: string;
  isPrivate: boolean;
  languages: { name: string; size: number }[];
};

type GithubLanguageEdge = { size: number; node: { name: string } };
type GithubRepoNode = {
  name: string;
  url: string;
  stargazerCount?: number;
  forkCount?: number;
  pushedAt?: string;
  isPrivate?: boolean;
  languages?: { edges?: GithubLanguageEdge[] };
};
type GithubContributionDay = { date: string; contributionCount: number };
type GithubContributionWeek = { contributionDays: GithubContributionDay[] };
type GithubGraphQLResponse = {
  data?: {
    user?: {
      login: string;
      name?: string | null;
      followers?: { totalCount: number };
      repositories?: { nodes?: GithubRepoNode[] };
      contributionsCollection?: {
        contributionCalendar?: { weeks?: GithubContributionWeek[] };
      };
    } | null;
  };
};

const emptyInsights = (login: string): GithubInsightsData => ({
  profile: { login, name: login, followers: 0 },
  summary: { totalRepos: 0, totalStars: 0, totalForks: 0 },
  languagesChart: [],
  activityPoints: [],
});

// GitHub returns contribution days as UTC `YYYY-MM-DD` strings, so bucket keys
// must be derived from UTC parts too. Building them from a local-time Date via
// `toISOString()` shifts every key back a month in UTC+ timezones, which
// silently discards the current month's contributions.
const monthKey = (year: number, monthIndex: number): string => {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      login
      name
      followers { totalCount }
      repositories(first: 50, ownerAffiliations: OWNER, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
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

export const fetchGithubInsights = async ({
  username,
  token,
  months = 6,
}: {
  username: string;
  token?: string;
  months?: number;
}): Promise<GithubInsightsData> => {
  if (!username || !token) {
    console.warn(
      "[github] GITHUB_TOKEN or username missing - rendering empty GitHub insights.",
    );
    return emptyInsights(username);
  }

  const now = new Date();
  const anchorYear = now.getUTCFullYear();
  const anchorMonth = now.getUTCMonth();
  // Request exactly the window we bucket below; a wider one is discarded.
  const from = new Date(
    Date.UTC(anchorYear, anchorMonth - (months - 1), 1),
  ).toISOString();
  const to = now.toISOString();

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { login: username, from, to },
      }),
      next: { revalidate: GITHUB_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.warn(
        `[github] GraphQL request failed: ${response.status} ${response.statusText}`,
      );
      return emptyInsights(username);
    }
    const json = (await response.json()) as GithubGraphQLResponse;
    const user = json?.data?.user;
    if (!user) return emptyInsights(username);

    const reposAll: GithubRepoSummary[] = (user.repositories?.nodes ?? []).map((repo) => ({
      name: repo.name,
      url: repo.url,
      stars: repo.stargazerCount ?? 0,
      forks: repo.forkCount ?? 0,
      pushedAt: repo.pushedAt ?? "",
      isPrivate: repo.isPrivate ?? false,
      languages:
        repo.languages?.edges?.map((edge) => ({
          name: edge.node.name,
          size: edge.size,
        })) ?? [],
    }));

    const summary = {
      totalRepos: reposAll.length,
      totalStars: reposAll.reduce((acc, repo) => acc + repo.stars, 0),
      totalForks: reposAll.reduce((acc, repo) => acc + repo.forks, 0),
    };

    const languageTotals: Record<string, number> = {};
    reposAll.forEach((repo) => {
      repo.languages.forEach((lang) => {
        languageTotals[lang.name] = (languageTotals[lang.name] ?? 0) + lang.size;
      });
    });
    // Take the top 6 first, then compute percentages over *those* bytes. The
    // donut necessarily normalizes its arcs over the displayed slices (else the
    // ring cannot close), so normalizing the labels over the global total would
    // print numbers that disagree with the arcs they sit next to and sum to
    // less than 100 under a "Top 6" heading.
    const topLanguages = Object.entries(languageTotals)
      .map(([name, bytes]) => ({ name, bytes }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 6);
    const topBytes = topLanguages.reduce((acc, lang) => acc + lang.bytes, 0);
    const languagesChart = topLanguages.map(({ name, bytes }) => ({
      name,
      bytes,
      percent: topBytes ? Math.round((bytes / topBytes) * 100) : 0,
    }));

    const activityMap = new Map<string, number>();
    for (let i = 0; i < months; i += 1) {
      activityMap.set(monthKey(anchorYear, anchorMonth - i), 0);
    }

    const days: GithubContributionDay[] =
      user.contributionsCollection?.contributionCalendar?.weeks?.flatMap(
        (week) => week.contributionDays,
      ) ?? [];
    days.forEach((day) => {
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
      languagesChart,
      activityPoints,
    };
  } catch (error) {
    console.warn("[github] GraphQL request threw:", error);
    return emptyInsights(username);
  }
};
