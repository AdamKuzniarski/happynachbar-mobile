"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { openGroupChat } from "@/lib/api/chat";
import { defaultLocale, isLocale } from "@/lib/i18n";

export function GroupChatButton({
  activityId,
  label = false,
}: {
  activityId: string;
  label?: boolean;
}) {
  const t = useTranslations("activities");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onOpen() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await openGroupChat(activityId);
      if (!res.ok) {
        setError(res.message ?? t("errors.invalidResponse"));
        return;
      }
      router.push(`/${locale}/chat/${encodeURIComponent(res.id)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        className={`hover:bg-fern/20 hover:text-foreground ${
          label ? "w-full gap-2" : ""
        }`}
        onClick={onOpen}
        disabled={loading}
        aria-label={t("actions.groupChat")}
      >
        {loading ? (
          tCommon("loading")
        ) : (
          <>
            <MessagesSquare className="h-4 w-4" aria-hidden="true" />
            {label ? (
              <span>{t("actions.groupChat")}</span>
            ) : (
              <span className="sr-only">{t("actions.groupChat")}</span>
            )}
          </>
        )}
      </Button>
      <FormError message={error} />
    </div>
  );
}
