import { cn } from "@/lib/cn";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger";

const STYLES: Record<BadgeVariant, string> = {
  neutral: "bg-surface text-foreground",
  success: "bg-limecream text-evergreen",
  warning: "bg-palm text-evergreen",
  danger: "bg-evergreen text-limecream",
};

export function Badge({
  variant = "neutral",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 border-fern px-2 py-0.5 text-xs font-semibold",
        STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
