import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn(
        "rounded-md border-2 border-fern bg-surface p-4 shadow-sm sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
