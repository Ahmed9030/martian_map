'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from 'cn';
import type { Vehicle } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

/** Approximate threshold for offering the description expansion control. */
const DESC_WORD_LIMIT = 30;

interface VehicleCarouselProps {
  vehicles: Vehicle[];
  vehicleIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  /** Called when the user confirms their vehicle choice. */
  onSelect: (vehicle: Vehicle) => void;
}

const navButtonClass = cn(
  'flex size-9 items-center justify-center rounded-full',
  'border border-white/15 bg-white/5 backdrop-blur-sm text-white/70',
  'hover:bg-orange-500/20 hover:border-orange-400/50 hover:text-white',
  'active:scale-95 transition-all duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry',
  'disabled:opacity-40 disabled:pointer-events-none',
);

export function VehicleCarousel({
  vehicles,
  vehicleIndex,
  onPrevious,
  onNext,
  onSelect,
}: VehicleCarouselProps) {
  const [expanded, setExpanded] = useState(false);
  const vehicle = vehicles[vehicleIndex];
  const total = vehicles.length;

  if (!vehicle) return null;

  const rawDesc = vehicle.description ?? '';
  const words = rawDesc.split(' ');
  const isLong = words.length > DESC_WORD_LIMIT;

  return (
    <GlassCard
      label="Vehicle selector"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); onPrevious(); }
        if (event.key === 'ArrowRight') { event.preventDefault(); onNext(); }
      }}
      className="flex flex-col gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry"
    >
      {/* Vehicle image */}
      {vehicle.photo && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5">
          <Image
            src={vehicle.photo}
            alt={vehicle.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Title */}
      <p className="text-center text-sm font-semibold text-white">
        {vehicle.name}
      </p>

      {/* Description with read-more toggle */}
      <div className="space-y-1">
        <p className={cn('text-[11px] leading-relaxed text-white/70', !expanded && 'line-clamp-4')}>
          {rawDesc}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs text-telemetry hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-telemetry"
          >
            {expanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>

      {/* ── Navigation row ── */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Previous vehicle"
          onClick={onPrevious}
          disabled={total <= 1}
          className={navButtonClass}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>

        {/* Counter + dot indicators */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="glass-panel rounded-full px-3 py-0.5 text-xs font-medium text-white/70">
            {vehicleIndex + 1} / {total}
          </span>
          <div className="flex gap-1" aria-hidden="true">
            {vehicles.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  i === vehicleIndex ? 'w-3 bg-mars' : 'w-1.5 bg-white/25',
                )}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Next vehicle"
          onClick={onNext}
          disabled={total <= 1}
          className={navButtonClass}
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      
    </GlassCard>
  );
}
