import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale } from "@/lib/i18n";

export default getRequestConfig(async ({ requestLocale, locale }) => {
  const resolvedLocale = locale ?? (await requestLocale);
  const safeLocale =
    resolvedLocale && isLocale(resolvedLocale)
      ? resolvedLocale
      : defaultLocale;

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});
