import Map from "@/components/Map";
import { Navbar } from "@/components/ui/Navbar";

export default function MapPage() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <Map />

      </main>
    </>
  );
}
