import { getPerson, getPrimaryEmail, type Language } from "@/lib/content";
import { Section } from "@/components/Section";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContactContent } from "@/components/ContactContent";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale as Language;

  const person = getPerson();
  const email = getPrimaryEmail();

  const pageTitle = lang === "es" ? "Contacto" : "Contact";
  const pageSubtitle = lang === "es" ? "Conversemos" : "Let’s talk";

  return (
    <>
      <Navbar lang={lang} />
      <main className="min-h-[70vh]">
        <Section title={pageTitle} subtitle={pageSubtitle}>
          <ContactContent person={person} email={email} lang={lang} />
        </Section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
