"use client";

import { Mail, MapPin, Linkedin, Clipboard } from "lucide-react";
import { Card } from "./Card";
import { useState } from "react";

interface ContactContentProps {
  person: any;
  email: string;
  lang: "es" | "en";
}

export function ContactContent({ person, email, lang }: ContactContentProps) {
  const [copyLabel, setCopyLabel] = useState("Copy email");
  
  const linkedin = person.links.find((link: any) => link.label.toLowerCase().includes("linkedin"));
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Unavailable");
    }
    setTimeout(() => {
      setCopyLabel("Copy email");
    }, 2000);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_top,rgba(255,90,54,0.3),transparent_55%)]"></div>
        <div className="relative">
          <h3 className="text-xl font-semibold">Let’s connect</h3>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            {person.location.city}, {person.location.region} · {person.location.country}
          </p>
          <div className="mt-6 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-[color:var(--color-accent)]" />
              <span>{email}</span>
            </div>
            {linkedin ? (
              <div className="flex items-center gap-3">
                <Linkedin size={18} className="text-[color:var(--color-accent)]" />
                <a className="underline" href={linkedin.url} target="_blank" rel="noreferrer">
                  {linkedin.url}
                </a>
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-[color:var(--color-accent)]" />
              <span>Available for global remote and research collaborations.</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-black/5 dark:hover:bg-white/5"
              type="button"
              onClick={handleCopy}
            >
              <Clipboard size={14} />
              {copyLabel}
            </button>
            <a
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent)] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
              href={`mailto:${email}`}
            >
              <Mail size={14} />
              Email me
            </a>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-semibold">Quick message</h3>
        <p className="mt-2 text-sm text-black/70 dark:text-white/70">
          Prefer a short intro? This opens your email client with a pre-filled message.
        </p>
        <form className="mt-6 space-y-3" action={`mailto:${email}`} method="post" encType="text/plain">
          <input className="w-full rounded-lg border border-black/20 bg-white/60 px-4 py-2 text-sm shadow-sm transition focus:border-black/40 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:focus:border-white/40" type="text" name="name" placeholder="Name" aria-label="Name" />
          <input className="w-full rounded-lg border border-black/20 bg-white/60 px-4 py-2 text-sm shadow-sm transition focus:border-black/40 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:focus:border-white/40" type="email" name="email" placeholder="Email" aria-label="Email" />
          <textarea className="w-full rounded-lg border border-black/20 bg-white/60 px-4 py-2 text-sm shadow-sm transition focus:border-black/40 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:focus:border-white/40" name="message" rows={4} placeholder="Message" aria-label="Message"></textarea>
          <button className="rounded-full bg-[color:var(--color-accent)] px-6 py-2 text-sm font-semibold text-white" type="submit">
            Send message
          </button>
        </form>
      </Card>
    </div>
  );
}
