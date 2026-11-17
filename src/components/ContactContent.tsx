"use client";

import { Mail, Globe, Linkedin, Clipboard } from "lucide-react";
import { Card } from "./Card";
import { useState } from "react";
import type { SiteData } from "@/lib/content";

type Person = SiteData["person"];

interface ContactContentProps {
  person: Person;
  email: string;
}

export function ContactContent({ person, email }: ContactContentProps) {
  const [copyLabel, setCopyLabel] = useState("Copy email");

  const linkedin = person.links.find((link) =>
    link.label.toLowerCase().includes("linkedin"),
  );
  
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
        <div aria-hidden className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_top,rgba(255,90,54,0.3),transparent_55%)]"></div>
        <div className="relative">
          <h3 className="text-xl font-semibold">Let’s connect</h3>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            {person.location.city}, {person.location.region} · {person.location.country}
          </p>
          <div className="mt-6 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-accent" />
              <span>{email}</span>
            </div>
            {linkedin ? (
              <div className="flex items-center gap-3">
                <Linkedin size={18} className="text-accent" />
                <a className="inline-flex min-h-11 items-center break-all underline md:min-h-0" href={linkedin.url} target="_blank" rel="noopener noreferrer">
                  {linkedin.url}
                </a>
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-accent" />
              <span>Available for global remote and research collaborations.</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-black/15 px-5 py-3 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
              type="button"
              onClick={handleCopy}
            >
              <Clipboard size={14} />
              {copyLabel}
            </button>
            <a
              className="inline-flex items-center gap-2 rounded-md bg-signal px-5 py-3 text-sm font-semibold text-ink hover:brightness-95"
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
          Prefer a short intro? Send me a message directly from here.
        </p>
        <ContactForm />
      </Card>
    </div>
  );
}

const FIELD =
  "w-full rounded-md border border-black/20 bg-white/60 px-4 py-3 text-sm transition focus-visible:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal dark:border-white/15 dark:bg-white/5";

function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const disabled = status === "loading" || status === "success";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
      <label htmlFor="contact-name" className="block pt-2 text-sm font-medium">Name</label>
      <input
        id="contact-name"
        className={FIELD}
        type="text"
        name="name"
        autoComplete="name"
        required
        disabled={disabled}
      />
      <label htmlFor="contact-email" className="block pt-2 text-sm font-medium">Email</label>
      <input
        id="contact-email"
        className={FIELD}
        type="email"
        name="email"
        autoComplete="email"
        required
        disabled={disabled}
      />
      <label htmlFor="contact-message" className="block pt-2 text-sm font-medium">Message</label>
      <textarea
        id="contact-message"
        className={FIELD}
        name="message"
        rows={4}
        required
        disabled={disabled}
      ></textarea>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          className="rounded-md bg-signal px-5 py-3 text-sm font-semibold text-ink hover:brightness-95 disabled:opacity-50"
          type="submit"
          disabled={disabled}
        >
          {status === "loading" ? "Sending..." : status === "success" ? "Message sent" : "Send message"}
        </button>

        {/* Always mounted so screen readers announce the text when it changes. */}
        <p aria-live="polite" className="text-sm">
          {status === "success" ? (
            <span className="text-data">Thanks for reaching out! I&apos;ll get back to you soon.</span>
          ) : status === "error" ? (
            <span className="text-red-700 dark:text-red-400">
              Something went wrong. Please try again or email me directly.
            </span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
