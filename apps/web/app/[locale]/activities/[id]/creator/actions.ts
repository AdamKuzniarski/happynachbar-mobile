"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { defaultLocale, isLocale } from "@/lib/i18n";

function getApiUrl() {
  return process.env.API_URL ?? "http://localhost:4000";
}

export async function startChatWithActivity(_prev: unknown, formData: FormData) {
  const localeValue = String(formData.get("locale") ?? "").trim();
  const locale = isLocale(localeValue) ? localeValue : defaultLocale;
  const t = await getTranslations({ locale, namespace: "activities" });
  const activityId = String(formData.get("activityId") ?? "").trim();
  if (!activityId) return { error: t("errors.missingActivity") };

  const token = (await cookies()).get("happynachbar_token")?.value;
  if (!token) return { error: t("errors.loginRequired") };

  const res = await fetch(
    `${getApiUrl()}/chat/conversations/by-activity/${encodeURIComponent(
      activityId,
    )}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return { error: t("errors.chatStartFailed") };
  }

  const convo = (await res.json()) as { id?: string };
  if (!convo?.id) return { error: t("errors.invalidResponse") };

  redirect(`/${locale}/chat/${encodeURIComponent(convo.id)}`);
}
