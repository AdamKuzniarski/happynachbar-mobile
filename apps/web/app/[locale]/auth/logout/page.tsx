"use client";

import * as React from "react";
import { logout } from "../login/actions";
import { useTranslations } from "next-intl";

export default function LogoutPage() {
  const t = useTranslations("auth");
  React.useEffect(() => {
    logout();
  }, []);

  return (
    <main className="px-4">
      <div className="mx-auto w-full max-w-md pt-12 pb-16 sm:max-w-2xl sm:pt-20">
        <h1 className="text-center text-xl font-semibold sm:text-2xl">
          {t("logoutTitle")}
        </h1>
        <p className="mt-5 text-center text-sm text-foreground/80">
          {t("logoutSubtitle")}
        </p>

        <div className="mt-10" />
      </div>
    </main>
  );
}
