"use client";

import { getPerson, getRoutes } from "@/lib/content";
import { Menu, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const person = getPerson();
  const routes = getRoutes();
  const pathname = usePathname();
  const toggleTheme = () => {
    const next = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-bg/80 backdrop-blur dark:border-white/10">
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <Link className="text-base font-semibold tracking-tight [font-stretch:82%]" href="/">
          {person.name}
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm md:flex">
          {routes.map((route) => (
            <Link
              key={route.path}
              aria-current={isActive(route.path) ? "page" : undefined}
              className="rounded-md px-3 py-2 text-muted transition hover:text-fg aria-[current=page]:text-fg aria-[current=page]:underline aria-[current=page]:decoration-signal aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[6px]"
              href={route.path}
            >
              {route.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md text-muted transition hover:bg-black/5 hover:text-fg dark:hover:bg-white/10"
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {/* Icon follows the <html> class, so it is right before hydration too. */}
            <Moon size={18} className="dark:hidden" />
            <Sun size={18} className="hidden dark:block" />
          </button>
          <details className="group relative md:hidden">
            <summary
              aria-label="Menu"
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md text-muted hover:text-fg [&::-webkit-details-marker]:hidden"
            >
              <Menu size={20} />
            </summary>
            <nav
              aria-label="Main"
              className="absolute right-0 top-12 flex w-52 flex-col rounded-xl border border-black/10 bg-bg p-2 shadow-[0_12px_32px_rgba(11,15,20,0.12)] dark:border-white/15"
            >
              {routes.map((route) => (
                <Link
                  key={route.path}
                  aria-current={isActive(route.path) ? "page" : undefined}
                  className="rounded-md px-3 py-3 text-sm text-muted hover:bg-black/5 hover:text-fg aria-[current=page]:text-fg dark:hover:bg-white/10"
                  href={route.path}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
