import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-buttons)] text-body-sm font-medium transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_a]:no-underline",
  {
    variants: {
      variant: {
        default:
          "bg-sidebar-active text-white shadow-sm hover:bg-sidebar-active/90 [&_a]:text-white [&_svg]:text-white",
        destructive:
          "border border-rich-plum bg-white text-rich-plum hover:bg-hint-of-sky",
        outline:
          "border border-ash-gray bg-white text-sidebar-text hover:bg-hint-of-sky hover:text-sidebar-text [&_a]:text-inherit",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "bg-transparent hover:bg-transparent hover:text-sidebar-active hover:underline hover:underline-offset-2",
        link: "text-sidebar-text underline-offset-4 hover:text-sidebar-active hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-[var(--radius-buttons)] px-3 text-caption has-[>svg]:px-2.5",
        lg: "h-10 rounded-[var(--radius-buttons)] px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-[var(--radius-buttons)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
