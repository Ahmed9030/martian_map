import { Footer } from "@/components/home/Footer";
import { HeroPlanet } from "@/components/home/HeroPlanet";
import { MarsLandings } from "@/components/home/MarsLandings";
import { ImpactSection } from "@/components/home/ImpactSection";
import { SpaceCarousel } from "@/components/home/SpaceCarousel";
import { WhyMartianMap } from "@/components/home/WhyMartianMap";
import { Navbar } from "@/components/ui/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-hidden bg-home text-home-cream">
        <HeroPlanet />
        <ImpactSection />
        <SpaceCarousel />
        <MarsLandings />
        <WhyMartianMap />
      </main>
      <Footer />
    </>
  );
}
