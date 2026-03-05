"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { loginAndSetCookie } from "./actions";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { defaultLocale, isLocale } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);
    try {
      const result = await loginAndSetCookie(email.trim(), password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/homepage`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4">
      <div className="mx-auto mt-10 max-w-sm">
        <h1 className="text-center text-2xl font-bold sm:text-3xl">
          {t("loginTitle")}
        </h1>
        <p className="mt-4 text-center text-sm text-foreground/80">
          {t("loginSubtitle")}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mx-auto mt-8 flex max-w-sm flex-col gap-3"
      >
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
          {loading ? tCommon("loading") : t("loginButton")}
        </Button>
        <p className="text-center text-xs">
          <Link href={`/${locale}/auth/forgot`} className="underline font-semibold">
            Passwort vergessen?
          </Link>
        </p>
        <p className="text-center text-xs">
          {t("registerPrompt")}{" "}
          <Link
            href={`/${locale}/auth/register`}
            className="underline font-semibold"
          >
            {t("registerLink")}
          </Link>
          .
        </p>
      </form>
    </main>
  );
}
