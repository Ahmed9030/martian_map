import { DiscoverMars } from "@/components/home/DiscoverMars";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { MarsLandings } from "@/components/home/MarsLandings";
import { Reliability } from "@/components/home/Reliability";
import { Services } from "@/components/home/Services";
import { SpaceTravel } from "@/components/home/SpaceTravel";
import { Navbar } from "@/components/ui/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-hidden bg-home text-home-cream">
        <Hero />
        <Services />
        <DiscoverMars />
        <SpaceTravel />
        <MarsLandings />
        <Reliability />
      </main>
      <Footer />
    </>
  );
}
