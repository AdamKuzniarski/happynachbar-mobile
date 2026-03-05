import * as React from "react";
import { cn } from "@/lib/cn";

export function Select({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"select">) {
  const base =
    "h-11 w-full rounded-md border-2 border-fern bg-surface px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-fern/40";

  return <select className={cn(base, className)} {...props} />;
}
