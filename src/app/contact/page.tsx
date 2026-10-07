import { getPerson, getPrimaryEmail, pageMetadata } from "@/lib/content";
import { Section } from "@/components/Section";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContactContent } from "@/components/ContactContent";

export const metadata = pageMetadata(
  "/contact",
  "Contact Joel Perca",
  "Get in touch with Joel Perca about AI engineering, research collaborations, or vision-language and retrieval projects.",
);

export default function ContactPage() {
  const person = getPerson();
  const email = getPrimaryEmail();

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Section title="Contact" subtitle="Let’s talk" as="h1">
          <ContactContent person={person} email={email} />
        </Section>
      </main>
      <Footer />
    </>
  );
}
