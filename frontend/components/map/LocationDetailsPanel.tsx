'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { cn } from 'cn';
import type { Destination } from '@/lib/api';
import { PanelCloseButton } from './PanelCloseButton';
import { MAP_LAYER } from './layers';

export interface SelectedDestination extends Destination {
  role: string;
}

interface LocationDetailsPanelProps {
  destination: SelectedDestination | null;
  onClose: () => void;
}

function fixMojibake(text: string): string {
  return text.replace(/MarsÆ/g, "Mars'");
}

export function LocationDetailsPanel({ destination, onClose }: LocationDetailsPanelProps) {
  const isOpen = destination !== null;
  const description = destination?.description ? fixMojibake(destination.description) : '';

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="location-details-title"
      className={cn(
        `fixed bottom-4 left-1/2 ${MAP_LAYER.panel} flex max-h-[45vh] -translate-x-1/2 flex-col overflow-hidden rounded-2xl glass-panel`,
        'w-[min(720px,calc(100vw-2rem))] lg:w-[min(720px,calc(100vw-740px))]',
        'max-md:inset-x-0 max-md:bottom-0 max-md:left-0 max-md:w-full max-md:max-h-[60vh] max-md:translate-x-0 max-md:rounded-b-none max-md:rounded-t-2xl',
        'transition-all duration-300',
        isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 opacity-0 pointer-events-none',
      )}
    >
      <div className="grid min-h-0 flex-1 md:grid-cols-[200px_1fr]">
        <div className="relative hidden min-h-0 bg-white/5 md:block">
          {destination?.photo && (
            <Image src={destination.photo} alt={destination.title} fill className="object-cover" unoptimized />
          )}
        </div>
        <div className="flex min-h-0 flex-col">
          <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">{destination?.role ?? ''}</p>
              <h2 id="location-details-title" className="truncate text-sm font-semibold text-white">{destination?.title ?? ''}</h2>
            </div>
            <PanelCloseButton onClose={onClose} />
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-3 [scrollbar-color:rgb(255_255_255/0.15)_transparent] [scrollbar-width:thin]">
            <div className="relative mb-3 aspect-video overflow-hidden rounded-xl bg-white/5 md:hidden">
              {destination?.photo && <Image src={destination.photo} alt={destination.title} fill className="object-cover" unoptimized />}
            </div>
            <p className="text-xs leading-relaxed text-white/70">{description}</p>
          </div>
        </div>
      </div>

    </section>
  );
}
