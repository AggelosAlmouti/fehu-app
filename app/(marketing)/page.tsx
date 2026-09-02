import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { InstallSection } from "@/components/marketing/install-section";
import { Faq } from "@/components/marketing/faq";

export default function LandingPage() {
  return (
    <main className="min-h-dvh">
      <Hero />
      <Features />
      <InstallSection />
      <Faq />
    </main>
  );
}
