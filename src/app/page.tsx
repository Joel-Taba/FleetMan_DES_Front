import { Header } from "@/components/fleetman/Header";
import { Hero } from "@/components/fleetman/Hero";
import { ChallengesSolutions } from "@/components/fleetman/ChallengesSolutions";
import { LandingFeaturesGrid } from "@/components/fleetman/LandingFeaturesGrid";
import { BenefitsSection } from "@/components/fleetman/BenefitsSection";
import { HowItWorks } from "@/components/fleetman/HowItWorks";
import { PricingSection } from "@/components/fleetman/PricingSection";
import { TestimonialsSection } from "@/components/fleetman/TestimonialsSection";
import { FaqSection } from "@/components/fleetman/FaqSection";
import { LandingCTA } from "@/components/fleetman/LandingCTA";
import { Footer } from "@/components/fleetman/Footer";

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <ChallengesSolutions />
      <LandingFeaturesGrid />
      <BenefitsSection />
      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <LandingCTA />
      <Footer />
    </main>
  );
}
