import { Button as ButtonPrimitive } from "@base-ui/react/button";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-telemetry focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-[var(--button-primary)] text-white hover:bg-[var(--button-primary-hover)]",
        secondary: "border-white/15 bg-transparent text-foreground hover:bg-white/8",
        glass: "glass-panel text-foreground hover:border-white/25",
        accent:
          "bg-home-coral font-semibold text-home-ink hover:-translate-y-0.5 hover:bg-home-ember",
        quiet:
          "border-white/25 bg-white/5 text-home-cream hover:-translate-y-0.5 hover:border-home-ember/70 hover:bg-white/10",
      },
      size: {
        default:
          "h-10 gap-1.5 px-7 py-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-8 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

type ButtonProps = Omit<ButtonPrimitive.Props, "className" | "render"> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    href?: string;
  };

function Button({
  className,
  variant = "primary",
  size = "default",
  href,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      nativeButton={href === undefined}
      render={href ? <Link href={href} /> : undefined}
      {...props}
    />
  )
}

export { Button, buttonVariants }
