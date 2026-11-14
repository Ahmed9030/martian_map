import { Suspense } from "react";
import Map from "@/components/Map";
import { OnboardingProvider } from "@/components/onboarding";
import { Navbar } from "@/components/ui/Navbar";

export default function MapPage() {
  return (
    <OnboardingProvider>
      <Navbar />
      <main className="relative">
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-home text-xs uppercase tracking-[0.2em] text-home-muted">
              Loading mission map…
            </div>
          }
        >
          <Map />
        </Suspense>
      </main>
    </OnboardingProvider>
  );
}
