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
          Prefer a short intro? Send me a message directly from here.
        </p>
        <ContactForm />
      </Card>
    </div>
  );
}

function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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
      <input 
        className="w-full rounded-lg border border-black/20 bg-white/60 px-4 py-2 text-sm shadow-sm transition focus:border-black/40 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:focus:border-white/40" 
        type="text" 
        name="name" 
        placeholder="Name" 
        aria-label="Name" 
        required 
        disabled={status === "loading" || status === "success"}
      />
      <input 
        className="w-full rounded-lg border border-black/20 bg-white/60 px-4 py-2 text-sm shadow-sm transition focus:border-black/40 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:focus:border-white/40" 
        type="email" 
        name="email" 
        placeholder="Email" 
        aria-label="Email" 
        required 
        disabled={status === "loading" || status === "success"}
      />
      <textarea 
        className="w-full rounded-lg border border-black/20 bg-white/60 px-4 py-2 text-sm shadow-sm transition focus:border-black/40 focus:outline-none dark:border-white/15 dark:bg-white/5 dark:focus:border-white/40" 
        name="message" 
        rows={4} 
        placeholder="Message" 
        aria-label="Message" 
        required
        disabled={status === "loading" || status === "success"}
      ></textarea>
      
      <div className="flex items-center gap-3">
        <button 
          className="rounded-full bg-[color:var(--color-accent)] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50" 
          type="submit"
          disabled={status === "loading" || status === "success"}
        >
          {status === "loading" ? "Sending..." : status === "success" ? "Message Sent" : "Send message"}
        </button>
        
        {status === "success" && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Thanks for reaching out! I'll get back to you soon.
          </span>
        )}
        
        {status === "error" && (
          <span className="text-sm text-red-600 dark:text-red-400">
            Something went wrong. Please try again or email me directly.
          </span>
        )}
      </div>
    </form>
  );
}
