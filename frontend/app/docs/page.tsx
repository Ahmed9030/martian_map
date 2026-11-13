import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Navbar } from "@/components/ui/Navbar";
import { TelemetryCard } from "@/components/ui/TelemetryCard";

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl space-y-12 px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <section className="max-w-2xl">
          <p className="text-label font-semibold uppercase tracking-[0.28em] text-mars">
            NASA Space Apps · Mars Mission
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[0.12em] text-foreground sm:text-5xl">
            MARS <span className="text-mars">/</span> COMPONENTS
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-secondary sm:text-base">
            A live preview of the shared navigation, buttons, glass panels, and
            mission telemetry components.
          </p>
          <Button href="/docs/api" variant="secondary" className="mt-5">
            Read API documentation
          </Button>
        </section>

        <section aria-labelledby="buttons-heading" className="space-y-4">
          <div>
            <p className="text-label font-semibold uppercase tracking-[0.18em] text-muted">
              Shared UI
            </p>
            <h2 id="buttons-heading" className="mt-1 text-lg font-semibold">
              Button variants
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Explore Mars</Button>
            <Button variant="secondary">View the map</Button>
            <Button variant="glass">Mission details</Button>
          </div>
        </section>

        <section aria-labelledby="telemetry-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-label font-semibold uppercase tracking-[0.18em] text-muted">
                Sample preview data
              </p>
              <h2 id="telemetry-heading" className="mt-1 text-lg font-semibold">
                Environmental conditions
              </h2>
            </div>
            <p className="text-label text-muted">Values are passed in as props</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TelemetryCard
              title="Temperature"
              value="210"
              unit="K"
              source="MRO / HiRISE"
              progress={62}
              detail="Average"
            />
            <TelemetryCard
              title="Radiation"
              value="0.4"
              unit="mSv/h"
              source="Mars surface estimate"
              progress={28}
            />
            <TelemetryCard
              title="Slope"
              value="12"
              unit="°"
              source="Terrain profile"
              progress={20}
              detail="Low risk"
            />
            <TelemetryCard
              title="Speed"
              value="60"
              unit="km/h"
              source="Vehicle telemetry"
            />
          </div>
        </section>

        <section aria-labelledby="glass-heading" className="space-y-4">
          <div>
            <p className="text-label font-semibold uppercase tracking-[0.18em] text-muted">
              Reusable container
            </p>
            <h2 id="glass-heading" className="mt-1 text-lg font-semibold">
              Glass card
            </h2>
          </div>
          <GlassCard className="max-w-2xl p-6">
            <p className="text-label font-semibold uppercase tracking-[0.16em] text-mars">
              Mission briefing
            </p>
            <h3 className="mt-3 text-xl font-semibold">
              Plan your route across Mars
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">
              GlassCard accepts regular content and layout classes, so it can
              wrap panels throughout the map interface.
            </p>
            <Button href="#map-preview" variant="glass" className="mt-5">
              Open map 
            </Button>
          </GlassCard>
        </section>

        
      </main>
    </>
  );
}
