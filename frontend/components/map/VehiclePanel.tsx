'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Truck } from 'lucide-react';
import { cn } from 'cn';
import { PanelCloseButton } from './PanelCloseButton';
import { MAP_LAYER } from './layers';

interface VehiclePanelProps {
  children: ReactNode;
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
}

function subscribeDesktop(callback: () => void) {
  const query = window.matchMedia('(min-width: 768px)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

function getDesktopSnapshot() {
  return window.matchMedia('(min-width: 768px)').matches;
}

function getDesktopServerSnapshot() {
  return false;
}

export function VehiclePanel({ children, isLoading, hasError, isEmpty }: VehiclePanelProps) {
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getDesktopServerSnapshot);
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const isOpen = userOpen ?? isDesktop;
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setUserOpen(false), []);

  useEffect(() => {
    if (isOpen) return;
    launcherRef.current?.focus();
  }, [isOpen]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        data-tour="vehicle-launcher"
        aria-expanded={isOpen}
        aria-controls="vehicle-selector-panel"
        aria-label={isOpen ? 'Close vehicle selector' : 'Open vehicle selector'}
        onClick={() => setUserOpen(!isOpen)}
        className={cn(
          `fixed right-4 top-24 ${MAP_LAYER.panel} flex size-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-black/70 text-white shadow-lg backdrop-blur transition-all duration-300 md:h-11 md:w-auto md:px-4`,
          isOpen && 'pointer-events-none translate-x-full opacity-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry',
        )}
      >
        <Truck size={18} />
        <span className="hidden text-sm md:inline">Vehicle</span>
      </button>

      <div
        id="vehicle-selector-panel"
        ref={panelRef}
        data-tour="vehicle-panel"
        onKeyDown={handleKeyDown}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          `fixed right-4 top-24 ${MAP_LAYER.panel} w-[17rem] max-h-[calc(100vh-8rem)] overflow-y-auto text-white transition-all duration-300`,
          isOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-full opacity-0',
        )}
      >
        <div className="mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/60 px-2 py-1 backdrop-blur">          
        <h2 className="text-sm font-semibold">Choose a vehicle</h2>
          <PanelCloseButton onClose={close} ariaLabel="Close vehicle selector" />
        </div>
        {isLoading && <div className="glass-panel rounded-xl p-5 text-center text-xs text-gray-400">Loading vehicles…</div>}
        {hasError && <div className="glass-panel rounded-xl p-5 text-center text-sm text-red-400">Failed to load vehicles.</div>}
        {isEmpty && <div className="glass-panel rounded-xl p-5 text-center text-sm text-gray-400">No vehicles available.</div>}
        {children}
      </div>
    </>
  );
}
