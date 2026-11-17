import Link from "next/link";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Section>
        <Card className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="mt-4 text-black/70 dark:text-white/70">
            Page not found
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-signal px-5 py-3 text-sm font-semibold text-ink hover:brightness-95"
            href="/"
          >
            <ArrowLeft size={16} />
            Go home
          </Link>
        </Card>
      </Section>
    </main>
  );
}
