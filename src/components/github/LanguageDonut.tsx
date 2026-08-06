import type { GithubLanguageSlice } from "@/lib/github";

interface LanguageDonutProps {
  languages: GithubLanguageSlice[];
}

const PALETTE = ["#ff5a36", "#ffd166", "#06d6a0", "#4ea8de", "#4361ee", "#b5179e"];

type DonutSegment = GithubLanguageSlice & {
  color: string;
  share: number;
  offset: number;
};

export function LanguageDonut({ languages }: LanguageDonutProps) {
  const slices = languages.filter((item) => item.percent > 0);

  if (!slices.length) {
    return (
      <p className="mt-6 text-sm text-black/60 dark:text-white/70">
        Language data unavailable.
      </p>
    );
  }

  // Shares are normalized over the *displayed* slices' bytes, not the global
  // byte total: the list is already filtered and capped at the top 6, so those
  // bytes don't sum to the whole. Rounded percents are display-only - six of
  // them can total 97 or 103 and would leave the ring open or overlapping.
  const sliceBytes = slices.reduce((acc, item) => acc + item.bytes, 0);
  const segments = slices.reduce<DonutSegment[]>((acc, item, index) => {
    const previous = acc[acc.length - 1];
    acc.push({
      ...item,
      color: PALETTE[index % PALETTE.length],
      share: sliceBytes ? (item.bytes / sliceBytes) * 100 : 0,
      offset: previous ? previous.offset + previous.share : 0,
    });
    return acc;
  }, []);

  return (
    <div className="mt-6 flex items-center gap-6">
      {/* pathLength=100 normalizes the circumference so dasharray/dashoffset are
          plain percentages. r 54 / strokeWidth 32 => inner 38, outer 70. */}
      <svg
        viewBox="0 0 140 140"
        className="h-[140px] w-[140px] shrink-0"
        role="img"
        aria-label="Language distribution"
      >
        <g
          transform="rotate(-90 70 70)"
          className="[&:hover>circle]:opacity-40 [&>circle]:transition-opacity [&>circle:hover]:opacity-100"
        >
          {segments.map((segment) => (
            <circle
              key={segment.name}
              cx="70"
              cy="70"
              r={54}
              fill="none"
              stroke={segment.color}
              strokeWidth={32}
              pathLength={100}
              strokeDasharray={`${segment.share} ${100 - segment.share}`}
              strokeDashoffset={-segment.offset}
            >
              <title>{`${segment.name} · ${segment.percent}%`}</title>
            </circle>
          ))}
        </g>
      </svg>
      <div className="flex-1 space-y-2 text-sm">
        {segments.map((segment) => (
          <div key={segment.name} className="flex items-center justify-between gap-4">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate">{segment.name}</span>
            </span>
            <span className="tabular-nums text-black/60 dark:text-white/70">
              {segment.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
