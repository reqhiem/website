export type GithubRepo = {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  html_url: string;
  updated_at: string;
};

export type GithubLanguage = {
  name: string;
  bytes: number;
  percent: number;
};

export type GithubCommit = {
  date: string;
};

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

export const aggregateCommitsByWeek = (commits: GithubCommit[]) => {
  const map = new Map<string, number>();
  commits.forEach((commit) => {
    const date = new Date(commit.date);
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    weekStart.setDate(weekStart.getDate() + diff);
    const key = weekStart.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));
};
