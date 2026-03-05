import * as React from "react";
import { cn } from "@/lib/cn";

export function Textarea({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"textarea">) {
  const base =
    "w-full rounded-md border-2 border-fern bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/60 outline-none focus:ring-fern/40 min-h-25";

  return <textarea className={cn(base, className)} {...props} />;
}
