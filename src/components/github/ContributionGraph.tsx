import { Card } from "../Card";

interface ContributionGraphProps {
  svg: string;
}

// The snake SVG is inlined (rather than <img>) so its cells inherit the
// theme-aware CSS vars from .snake-scope in globals.css. Its <style> block is
// already scoped by loadSnakeSvg, which is why this is safe to inject.
export function ContributionGraph({ svg }: ContributionGraphProps) {
  return (
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
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </Card>
  );
}
