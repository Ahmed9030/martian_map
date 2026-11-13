'use client';

import { X } from 'lucide-react';
import { cn } from 'cn';

interface PanelCloseButtonProps {
  onClose: () => void;
  className?: string;
  ariaLabel?: string;
}

export function PanelCloseButton({ onClose, className, ariaLabel = 'Close location details' }: PanelCloseButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClose}
      className={cn(
        'flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 backdrop-blur-sm',
        'hover:border-white/30 hover:bg-white/10 hover:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        'active:scale-95 transition-all duration-150',
        className,
      )}
    >
      <X size={16} strokeWidth={2} />
    </button>
  );
}

