"use client";

import Link from "next/link";
import * as React from "react";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, User } from "lucide-react";
import { ThemeToggle } from "../theme/ThemeToggle";
import { ChatUnreadBadge } from "../chat/ChatUnreadBadge";
import { useLocale, useTranslations } from "next-intl";

export type HeaderVariant = "public" | "auth" | "app" | "logout";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:4000";

type UserMeResponse = {
  email?: string | null;
  profile?: { displayName?: string | null } | null;
};

export function AppHeader({
  variant,
  showBackOnAuth = false,
}: {
  variant: HeaderVariant;
  showBackOnAuth?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("header");
  const pathname = usePathname();
  const brandHref =
    variant === "app"
      ? `/${locale}/homepage`
      : variant === "auth"
        ? `/${locale}`
        : variant === "logout"
          ? `/${locale}/homepage`
          : undefined;

  const [userLabel, setUserLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (variant !== "app") return;
    let alive = true;
    fetch(`${apiBase}/users/me`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((me: UserMeResponse | null) => {
        if (!alive) return;
        const displayName = me?.profile?.displayName?.trim();
        const label = displayName || me?.email?.trim() || null;
        setUserLabel(label);
      })
      .catch(() => {
        if (!alive) return;
        setUserLabel(null);
      });

    return () => {
      alive = false;
    };
  }, [variant]);

  const btn =
    "rounded-md border-2 border-fern bg-limecream px-3 py-2 text-sm font-medium text-evergreen hover:bg-palm hover:text-limecream transition-colors sm:px-4";
  const iconBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-md border-2 border-fern bg-surface text-foreground hover:bg-palm hover:text-limecream transition-colors sm:h-10 sm:w-10";

  const brand = (
    <div className="flex items-center gap-2 sm:gap-3">
      <div
        className="h-9 w-9 rounded bg-fern sm:h-10 sm:w-10"
        aria-hidden="true"
      />
      <div className="flex flex-col items-start">
        <span className="text-sm font-semibold sm:text-lg text-foreground">
          happynachbar
        </span>
        {variant === "app" && userLabel ? (
          <span className="mt-1 text-xs text-foreground/80">
            {t("greeting", { name: userLabel })}
          </span>
        ) : null}
      </div>
    </div>
  );
  // MVP toggle: show link only when explicitly enabled
  const showAdminLink =
    variant === "app" && process.env.NEXT_PUBLIC_SHOW_ADMIN_LINK === "true";

  function buildLocaleHref(targetLocale: string) {
    if (!pathname) return `/${targetLocale}`;
    const parts = pathname.split("/");
    if (parts.length < 2) return `/${targetLocale}`;
    if (parts[1] === locale) {
      parts[1] = targetLocale;
      return parts.join("/") || `/${targetLocale}`;
    }
    return `/${targetLocale}${pathname === "/" ? "" : pathname}`;
  }

  return (
    <header className="border-b-2 border-fern">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3 sm:max-w-2xl sm:px-6 sm:py-4">
        {brandHref ? <Link href={brandHref}>{brand}</Link> : brand}

        <div className="flex items-center gap-2">
          <Link
            href={buildLocaleHref(locale === "de" ? "en" : "de")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border-2 border-fern bg-surface text-[11px] font-semibold text-foreground transition-colors hover:bg-palm hover:text-limecream sm:h-10 sm:w-10"
            aria-label={locale === "de" ? t("switchToEn") : t("switchToDe")}
          >
            {locale === "de" ? "DE" : "EN"}
          </Link>
          <ThemeToggle />

          {variant === "app" ? (
            <>
              <ChatUnreadBadge className={iconBtn} />
              <Link
                href={`/${locale}/profile`}
                className={iconBtn}
                aria-label={t("profileAria")}
              >
                <User className="h-4 w-4" aria-hidden="true" />
              </Link>
              {showAdminLink ? (
                <Link href={`/${locale}/admin/activities`} className={btn}>
                  {t("admin")}
                </Link>
              ) : null}

              <a
                href={`/${locale}/auth/logout`}
                className={iconBtn}
                aria-label={t("logoutAria")}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </a>
            </>
          ) : variant === "auth" ? (
            showBackOnAuth ? (
              <Link href={`/${locale}`} className={btn}>
                {t("back")}
              </Link>
            ) : (
              <Link
                href={`/${locale}/auth/login`}
                className={iconBtn}
                aria-label={t("loginAria")}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
              </Link>
            )
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className={iconBtn}
              aria-label={t("loginAria")}
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
