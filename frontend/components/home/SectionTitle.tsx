import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionTitleProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "h1" | "h2" | "h3";
};

export function SectionTitle({
  children,
  className,
  id,
  as: Heading = "h2",
}: SectionTitleProps) {
  return (
    <Heading
      id={id}
      className={cn(
        "font-display text-[clamp(1.9rem,4vw,3.4rem)] font-bold leading-[1.23] tracking-[-0.07em]",
        className,
      )}
    >
      {children}
    </Heading>
  );
}
