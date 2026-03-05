"use client";

import { Input } from "@/components/ui/Input";
import { registerUser } from "./actions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { FormError } from "@/components/ui/FormError";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { defaultLocale, isLocale } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;

  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const result = await registerUser(
        email.trim().toLowerCase(),
        password,
        displayName.trim() || undefined,
      );

      if (!result.ok) {
        setError(result.error);
        if (result.error.toLowerCase().includes("email already in use")) {
        }
        return;
      }

      router.push(`/${locale}/auth/login`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4">
      <div className="mx-auto w-full max-w-md pt-10 pb-12 sm:max-w-2xl sm:pt-16">
        <h1 className="text-center text-2xl font-bold sm:text-4xl">
          {t("registerTitle")}
        </h1>

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-8 flex max-w-sm flex-col gap-3"
        >
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("displayNamePlaceholder")}
          />
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
          />
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            type="password"
          />

          <FormError message={error} />
          <Button disabled={loading}>
            {loading ? tCommon("loading") : t("registerButton")}
          </Button>

          <p className="text-center text-xs">
            {t("loginPrompt")}{" "}
            <Link
              href={`/${locale}/auth/login`}
              className="underline font-semibold"
            >
              {t("loginLink")}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
