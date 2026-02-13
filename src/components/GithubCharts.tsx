"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface GithubChartsProps {
  languagesChart: { name: string; bytes: number; percent: number }[];
  activityPoints: { month: string; count: number }[];
  labels: { noLanguages: string; noActivity: string; activityLabel: string; activityHelper: string };
}

export function GithubCharts({ languagesChart, activityPoints, labels }: GithubChartsProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const filteredLanguages = languagesChart.filter((item) => item.percent > 0);
  const maxActivity = Math.max(...activityPoints.map((point) => point.count), 1);
  const activityScale = (count: number) => Math.max(6, Math.round((count / maxActivity) * 80));

  useEffect(() => {
    if (!chartRef.current || !filteredLanguages.length) return;

    const items = filteredLanguages;
    const langContainer = d3.select(chartRef.current);
    langContainer.selectAll("*").remove();

    const size = 140;
    const radius = size / 2;
    const svg = langContainer
      .append("svg")
      .attr("width", size)
      .attr("height", size)
      .append("g")
      .attr("transform", `translate(${radius}, ${radius})`);

    const color = d3
      .scaleOrdinal<string>()
      .domain(items.map((d) => d.name))
      .range(["#ff5a36", "#ffd166", "#06d6a0", "#4ea8de", "#4361ee", "#b5179e"]);

    const pie = d3.pie<{ name: string; bytes: number; percent: number }>().value((d) => d.bytes);
    const arc = d3.arc<d3.PieArcDatum<{ name: string; bytes: number; percent: number }>>().innerRadius(radius * 0.55).outerRadius(radius);

    const tooltip = langContainer
      .append("div")
      .style("position", "absolute")
      .style("padding", "6px 10px")
      .style("background", "rgba(15, 23, 42, 0.9)")
      .style("color", "white")
      .style("font-size", "12px")
      .style("border-radius", "999px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    svg
      .selectAll("path")
      .data(pie(items))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.name))
      .on("mousemove", (event, d) => {
        tooltip
          .style("opacity", 1)
          .style("left", `${event.offsetX + 10}px`)
          .style("top", `${event.offsetY - 10}px`)
          .text(`${d.data.name} · ${d.data.percent}%`);
      })
      .on("mouseleave", () => tooltip.style("opacity", 0));

  }, [filteredLanguages]);

  return (
    <>
      <div className="mt-6 flex items-center gap-6">
        <div ref={chartRef} className="relative h-40 w-40"></div>
        <div className="space-y-2 text-sm">
          {filteredLanguages.length ? (
            filteredLanguages.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] uppercase text-white/70">
                    {item.name.slice(0, 1)}
                  </span>
                  {item.name}
                </span>
                <span className="text-black/60 dark:text-white/70">{item.percent}%</span>
              </div>
            ))
          ) : (
            <p className="text-black/60 dark:text-white/70">{labels.noLanguages}</p>
          )}
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold">{labels.activityLabel}</h3>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] dark:text-white/60">
          {labels.activityHelper}
        </p>
        <div className="relative mt-4 h-28 w-full">
          {activityPoints.length ? (
            <div className="grid h-full grid-cols-6 items-end gap-2">
              {activityPoints.map((point) => (
                <div key={point.month} className="flex flex-col items-center gap-2">
                  <div
                    className="w-3 rounded-full bg-[color:var(--color-accent)]/80"
                    style={{ height: `${activityScale(point.count)}px` }}
                    title={`${point.month} · ${point.count}`}
                  ></div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
                    {point.month.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-black/60 dark:text-white/70">{labels.noActivity}</p>
          )}
        </div>
      </div>
    </>
  );
}
