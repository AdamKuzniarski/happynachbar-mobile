"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";
import { listActivityParticipants } from "@/lib/api/activities";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { GroupChatButton } from "./GroupChatButton";

type Participant = {
  id: string;
  displayName: string | null;
};

export function ParticipantsList({
  activityId,
  showGroupChat = false,
}: {
  activityId: string;
  showGroupChat?: boolean;
}) {
  const t = useTranslations("activities");
  const params = useParams();
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const res = await listActivityParticipants(activityId);
      if (!active) return;
      if (!res.ok) {
        const msg = Array.isArray(res.message)
          ? res.message.join(", ")
          : res.message ?? t("errors.invalidResponse");
        setError(msg);
        setLoading(false);
        return;
      }
      setParticipants(res.participants);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [activityId, t]);

  return (
    <div className="mt-5">
      <div className="text-sm font-semibold">{t("labels.participants")}</div>
      <div className="mt-2 rounded-xl bg-fern/10 p-4 text-sm ring-1 ring-fern/20">
        <div className="flex items-center justify-center">
          {showGroupChat ? <GroupChatButton activityId={activityId} label /> : null}
        </div>
        {loading ? (
          <span className="mt-2 inline-block opacity-70">
            {t("loadingParticipants")}
          </span>
        ) : error ? (
          <span className="mt-2 inline-block text-red-600">{error}</span>
        ) : participants.length === 0 ? (
          <span className="mt-2 inline-block opacity-70">
            {t("noParticipants")}
          </span>
        ) : (
          <ul className="mt-3 space-y-2">
            {participants.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/${locale}/users/${encodeURIComponent(p.id)}`}
                  className="inline-flex items-center gap-2 text-foreground/90 hover:text-foreground"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-fern/50 text-foreground/80">
                    <User className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {p.displayName?.trim() || t("fallback.neighbor")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
