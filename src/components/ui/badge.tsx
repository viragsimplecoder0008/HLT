import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";

import { cn } from "./utils";

const badgeVariants = cva(
  "glass-badge inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-300 overflow-hidden shadow-md hover:shadow-lg hover:scale-105",
  {
    variants: {
      variant: {
        default:
          "glass-gradient text-white border-0",
        secondary:
          "bg-secondary/80 text-secondary-foreground [a&]:hover:bg-secondary",
        destructive:
          "bg-destructive/80 text-white [a&]:hover:bg-destructive dark:bg-destructive/60",
        outline:
          "text-foreground border-white/30 dark:border-white/20 [a&]:hover:bg-white/50 dark:[a&]:hover:bg-slate-700/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
