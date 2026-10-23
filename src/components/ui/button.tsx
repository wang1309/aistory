import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:-translate-x-px hover:-translate-y-px hover:shadow-sm active:translate-x-0 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border bg-transparent shadow-xs hover:border-primary/50 hover:bg-card hover:text-accent-foreground dark:border-input dark:hover:bg-input/40",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        pill: "rounded-[3px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-[4px_4px_0_rgba(36,77,61,0.16)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_rgba(36,77,61,0.16)] active:translate-x-0 active:translate-y-0 dark:shadow-[4px_4px_0_rgba(0,0,0,0.45)]",
        pillOutline:
          "rounded-[3px] border border-border bg-transparent hover:border-primary/60 hover:bg-card active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-[2px] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-[2px] px-6 has-[>svg]:px-4",
        pill: "h-12 sm:h-14 rounded-[3px] px-7 text-[13px] font-semibold tracking-[0.02em]",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
