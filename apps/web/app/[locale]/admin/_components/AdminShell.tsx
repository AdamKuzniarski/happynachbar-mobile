"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/activities", label: "Activities" },
  { href: "/admin/users", label: "Users" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  };

  const linkBase =
    "block rounded-md border-2 border-fern px-3 py-2 text-sm font-medium transition-colors";
  const linkActive = "bg-surface-strong";
  const linkIdle = "bg-surface hover:bg-surface-strong";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-[170px_1fr] sm:gap-6">
        <aside className="rounded-md border-2 border-fern bg-surface p-3 sm:p-4">
          <div className="text-xs font-semibold tracking-wide opacity-80">
            Admin Dashboard
          </div>

          <nav className="mt-3 flex flex-wrap gap-2 sm:flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  linkBase,
                  "w-full sm:w-auto",
                  isActive(item.href) ? linkActive : linkIdle,
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
