import { ImageResponse } from "next/og";

import { OG_SIZE, OgCard } from "@/components/og/OgCard";
import { getPerson, getSite } from "@/lib/content";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = getSite().title;

export default function OpengraphImage() {
  const person = getPerson();
  return new ImageResponse(
    <OgCard eyebrow={getSite().domain} title={person.name} footer={person.headline} />,
    size,
  );
}
