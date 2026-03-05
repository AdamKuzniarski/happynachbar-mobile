"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { Button } from "@/components/ui/Button";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const params = useParams();
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;

  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim().toLowerCase());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Es ist ein unerwarteter Fehler aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4">
      <div className="mx-auto mt-10 max-w-sm">
        <h1 className="text-center text-2xl font-bold sm:text-3xl">
          Passwort vergessen
        </h1>
        <p className="mt-4 text-center text-sm text-foreground/80">
          Gib deine E-Mail-Adresse ein. Wenn ein Konto existiert, senden wir dir
          einen Reset-Link.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mx-auto mt-8 flex max-w-sm flex-col gap-3"
      >
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-Mail"
          autoComplete="email"
          required
        />
        <FormError message={error} />
        {submitted ? (
          <p className="text-sm text-foreground/80">
            Wenn ein Konto existiert, wurde eine E-Mail versendet.
          </p>
        ) : null}
        <Button disabled={loading || submitted}>
          {loading ? "Senden..." : "Reset-Link senden"}
        </Button>
        <p className="text-center text-xs">
          <Link href={`/${locale}/auth/login`} className="underline font-semibold">
            Zurück zum Login
          </Link>
        </p>
      </form>
    </main>
  );
}
