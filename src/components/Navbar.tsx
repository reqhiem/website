"use client";

import { getPerson, getRoutes } from "@/lib/content";
import { Link, usePathname } from "@/i18n/routing";
import { useEffect } from "react";

interface NavbarProps {
  lang: "es" | "en";
}

export function Navbar({ lang }: NavbarProps) {
  const person = getPerson();
  const routes = getRoutes(lang);
  const pathname = usePathname();

  const otherLang = lang === "es" ? "en" : "es";

  useEffect(() => {
    const toggle = document.getElementById("theme-toggle");
    const handleToggle = () => {
      const root = document.documentElement;
      const isDark = root.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    };

    if (toggle) {
      toggle.addEventListener("click", handleToggle);
    }
    return () => {
      if (toggle) toggle.removeEventListener("click", handleToggle);
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="container-page flex h-16 items-center justify-between">
        <Link className="text-sm font-semibold uppercase tracking-[0.2em]" href="/"> {person.name} </Link>
        <nav className="hidden items-center gap-6 text-sm uppercase tracking-[0.2em] md:flex">
          {routes.map((route) => (
            <Link 
              key={route.path}
              className={`opacity-70 transition hover:opacity-100 ${pathname === route.path ? "opacity-100" : ""}`}
              href={route.path}
            >
              {route.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            className="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.3em] transition hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
            href={pathname}
            locale={otherLang}
            aria-label={lang === "es" ? "Switch to English" : "Switch to Spanish"}
          >
            {lang === "es" ? "EN" : "ES"}
          </Link>
          <button
            className="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.3em] transition hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
            id="theme-toggle"
            type="button"
            aria-label="Toggle dark mode"
          >
            Theme
          </button>
        </div>
      </div>
      <div className="container-page pb-4 md:hidden">
        <details className="rounded-xl border border-black/10 p-3 dark:border-white/15">
          <summary className="cursor-pointer text-xs uppercase tracking-[0.2em]">
            {lang === "es" ? "Menú" : "Menu"}
          </summary>
          <div className="mt-3 flex flex-col gap-3 text-sm uppercase tracking-[0.2em]">
            {routes.map((route) => (
              <Link 
                key={route.path}
                className="opacity-70 transition hover:opacity-100" 
                href={route.path}
              >
                {route.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
