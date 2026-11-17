import { getPerson, getSite } from "@/lib/content";

export function Footer() {
  const person = getPerson();
  const site = getSite();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/5 py-10 text-sm dark:border-white/10">
      <div className="container-page flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium">{person.name}</p>
          <p className="text-muted">{person.headline} · {year}</p>
        </div>
        <div className="flex flex-wrap gap-x-4">
          {/* The "Website" entry is this site; it gets the same-tab domain link below instead. */}
          {person.links.filter((link) => !link.url.includes(site.domain)).map((link) => (
            <a
              key={link.label}
              className="inline-flex min-h-11 items-center text-muted transition hover:text-fg md:min-h-0"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
          <a className="inline-flex min-h-11 items-center text-muted transition hover:text-fg md:min-h-0" href={`https://${site.domain}`}>
            {site.domain}
          </a>
        </div>
      </div>
    </footer>
  );
}
