import * as React from "react";
import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"input">) {
  const base =
    "h-11 w-full rounded-md border-2 border-fern bg-surface px-3 text-sm text-foreground placeholder:text-foreground/60 outline-none focus:ring-fern/40";

  return <input className={cn(base, className)} {...props} />;
}
