"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { Button } from "@/components/ui/Button";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { resetPassword } from "./actions";

function ResetPasswordInner() {
  const params = useParams();
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;

  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!token) {
      setError("Ungültiger oder fehlender Token.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await resetPassword(token, newPassword);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4">
      <div className="mx-auto mt-10 max-w-sm">
        <h1 className="text-center text-2xl font-bold sm:text-3xl">
          Passwort zurücksetzen
        </h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="mx-auto mt-8 flex max-w-sm flex-col gap-3"
      >
        {!token ? (
          <p className="text-sm text-red-600">Ungültiger oder fehlender Token.</p>
        ) : null}

        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Neues Passwort"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Neues Passwort wiederholen"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <FormError message={error} />

        {done ? (
          <p className="text-sm text-foreground/80">
            Passwort wurde erfolgreich geändert.
          </p>
        ) : null}

        <Button disabled={loading || done || !token}>
          {loading ? "Speichern..." : "Neues Passwort speichern"}
        </Button>
        <p className="text-center text-xs">
          <Link href={`/${locale}/auth/login`} className="underline font-semibold">
            Zum Login
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="px-4 py-6 text-center">Lade...</p>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
