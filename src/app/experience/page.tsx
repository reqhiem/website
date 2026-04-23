import {
  getExperienceSorted,
  formatDateRange,
  getEducation,
} from "@/lib/content";
import { Section } from "@/components/Section";
import { Timeline } from "@/components/Timeline";
import { TimelineItem } from "@/components/TimelineItem";
import { Badge } from "@/components/Badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ExperiencePage() {
  const experience = getExperienceSorted();
  const education = getEducation();

  const timeline = [
    ...experience.map((item) => ({
      type: "work",
      title: `${item.title} · ${item.company}`,
      subtitle: item.location,
      summary: item.summary,
      highlights: item.highlights,
      tags: item.tags,
      start: item.start,
      end: item.end,
    })),
    ...education.map((item) => ({
      type: "education",
      title: item.degree,
      subtitle: `${item.institution} · ${item.location}`,
      summary: item.status ?? "",
      highlights: item.highlights ?? [],
      tags: ["Academia"],
      start: item.start,
      end: item.end,
    })),
  ].sort((a, b) => {
    const aEnd = a.end ?? "9999-12";
    const bEnd = b.end ?? "9999-12";
    if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
    return b.start.localeCompare(a.start);
  });

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Section title="Experience" subtitle="Timeline">
          <Timeline>
            {timeline.map((item, index) => (
              <TimelineItem
                key={index}
                title={item.title}
                subtitle={item.subtitle}
                meta={formatDateRange(item.start, item.end)}
              >
                {item.summary ? <p>{item.summary}</p> : null}
                {item.highlights.length ? (
                  <ul className="list-disc pl-4">
                    {item.highlights.map((highlight, hIndex) => (
                      <li key={hIndex}>{highlight}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag, tIndex) => (
                    <Badge key={tIndex} label={tag} />
                  ))}
                </div>
              </TimelineItem>
            ))}
          </Timeline>
        </Section>
      </main>
      <Footer />
    </>
  );
}
