import type { ReactNode } from "react";
import type { IconId } from "@/lib/constants/home";
import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={cn("size-4", className)}
    >
      <path
        d="M4.167 10h11.666m0 0-5-5m5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronIcon({
  direction,
  className,
}: IconProps & { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-5", className)}
    >
      <path
        d={direction === "left" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const iconPaths: Record<IconId, ReactNode> = {
  destination: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  vehicle: (
    <>
      <rect x="3" y="10" width="18" height="7" rx="2" />
      <path d="M7 10V7h10v3M7 17v2M17 17v2M9 13.5h6" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h6a3 3 0 0 0 0-6H10a3 3 0 0 1 0-6h6" />
    </>
  ),
  safe: (
    <>
      <path d="M12 3 4 6.5v5c0 4.9 8 9.5 8 9.5s8-4.6 8-9.5v-5L12 3Z" />
      <path d="m9 11.5 2 2 4-4.5" />
    </>
  ),
  science: (
    <>
      <path d="M9.5 3h5M10.5 3v5.5L5.6 17a2 2 0 0 0 1.7 3h9.4a2 2 0 0 0 1.7-3l-4.9-8.5V3" />
      <path d="M8 14h8" />
    </>
  ),
  data: (
    <>
      <path d="M12 3v6M8.5 9h7l3 4.5a6 6 0 1 1-13 0L8.5 9Z" />
      <path d="M12 15v3" />
    </>
  ),
};

export function OutlineIcon({ id, className }: IconProps & { id: IconId }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-6", className)}
    >
      {iconPaths[id]}
    </svg>
  );
}
