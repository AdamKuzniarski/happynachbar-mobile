"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isValidPostalCode, normalizePostalCodeInput } from "@/lib/validators";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { useTranslations } from "next-intl";

export function PostalCodeForm() {
  const [postalCode, setPostalCode] = useState("");
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("postalCodeForm");
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;

  const isValid = isValidPostalCode(postalCode);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValid) return;

    localStorage.setItem("postalCode", postalCode);
    router.push(
      `/${locale}/teaser?postalCode=${encodeURIComponent(postalCode)}`,
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col items-center gap-2">
      <label htmlFor="postalCode" className="text-xs font-medium text-center">
        {t("label")}
      </label>

      <input
        id="postalCode"
        name="postalCode"
        inputMode="numeric"
        maxLength={5}
        autoComplete="postal-code"
        placeholder={t("placeholder")}
        value={postalCode}
        onChange={(e) => {
          setPostalCode(normalizePostalCodeInput(e.target.value));
        }}
        className="
          h-8
          w-32
          rounded-md
          border
          px-2
          text-sm
          text-center
          sm:w-40
        "
        aria-invalid={postalCode.length > 0 && !isValid}
      />

      {postalCode.length > 0 && !isValid && (
        <p className="text-xs text-red-600 text-center">
          {t("invalid")}
        </p>
      )}

      <Button
        type="submit"
        disabled={!isValid}
        className="
          mt-1
          h-8
          w-48
          rounded-md
          border-2 border-fern
          bg-palm
          text-xs
          font-medium
          text-white
          hover:bg-hunter
          transition-colors
          disabled:cursor-not-allowed
          disabled:opacity-50
          sm:w-64
        "
      >
        {t("submit")}
      </Button>
    </form>
  );
}
