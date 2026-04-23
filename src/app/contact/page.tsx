import { getPerson, getPrimaryEmail } from "@/lib/content";
import { Section } from "@/components/Section";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContactContent } from "@/components/ContactContent";

export default function ContactPage() {
  const person = getPerson();
  const email = getPrimaryEmail();

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Section title="Contact" subtitle="Let’s talk">
          <ContactContent person={person} email={email} />
        </Section>
      </main>
      <Footer />
    </>
  );
}
