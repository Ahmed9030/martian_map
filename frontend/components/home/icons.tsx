import type { ReactNode } from "react";
import type { BenefitId } from "@/lib/constants/home";
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

const benefitPaths: Record<BenefitId, ReactNode> = {
  cheap: (
    <>
      <path d="M12 3 4 7v5c0 5 8 9 8 9s8-4 8-9V7l-8-4Z" />
      <path d="m9 13 2 2 4-5" />
    </>
  ),
  health: (
    <>
      <path d="M20.8 8.6c0 5.2-8.8 10-8.8 10S3.2 13.8 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z" />
      <path d="M4 12h4l2-3 3.5 6 2-3H20" />
    </>
  ),
  secure: (
    <>
      <path d="M12 3 4 7v5c0 5 8 9 8 9s8-4 8-9V7l-8-4Z" />
      <circle cx="12" cy="11" r="2" />
      <path d="M12 13v2" />
    </>
  ),
  quick: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
};

export function BenefitIcon({
  id,
  className,
}: IconProps & { id: BenefitId }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-[34px]", className)}
    >
      {benefitPaths[id]}
    </svg>
  );
}
