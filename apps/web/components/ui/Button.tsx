import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className,
  asChild,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  asChild?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  const styles: Record<Variant, string> = {
    primary: "bg-palm text-white hover:bg-hunter",
    secondary: "border-2 border-fern bg-surface text-foreground",
    ghost: "text-foreground underline hover:opacity-80",
  };

  const classes = cn(base, styles[variant], className);

  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      ...props,
      className: cn(classes, children.props.className),
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
