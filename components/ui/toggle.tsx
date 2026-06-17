"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-buttons)] text-sm font-medium transition-colors hover:bg-hint-of-sky hover:text-sidebar-text disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-shadow-tint-blue data-[state=on]:text-sidebar-active outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-ash-gray bg-white shadow-xs hover:bg-hint-of-sky",
      },
      size: {
        default: "h-9 px-2.5 min-w-9",
        sm: "h-8 px-2 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Toggle({
  className,
  variant,
  size,
  pressed,
  onPressedChange,
  onClick,
  type = "button",
  ...props
}: Omit<React.ComponentProps<"button">, "onClick"> &
  VariantProps<typeof toggleVariants> & {
    pressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }) {
  return (
    <button
      type={type}
      data-slot="toggle"
      data-state={pressed ? "on" : "off"}
      aria-pressed={pressed}
      className={cn(toggleVariants({ variant, size, className }))}
      onClick={(event) => {
        onClick?.(event);
        onPressedChange?.(!pressed);
      }}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
