"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { listActivityParticipants } from "@/lib/api/activities";

type Participant = {
  id: string;
  displayName: string | null;
};

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function ParticipantsPreview({
  activityId,
  participantsCount,
  fetchParticipants = true,
}: {
  activityId: string;
  participantsCount?: number;
  fetchParticipants?: boolean;
}) {
  const t = useTranslations("activities");
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!fetchParticipants) return;
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
  }, [activityId, fetchParticipants, t]);

  const maxAvatars = 3;
  const visible = participants.slice(0, maxAvatars);
  const extraCount =
    participants.length > maxAvatars ? participants.length - maxAvatars : 0;
  const fallbackCount =
    typeof participantsCount === "number" ? participantsCount : 0;
  const showFallback = !fetchParticipants || !!error;
  const fallbackVisible = Math.min(fallbackCount, maxAvatars);
  const fallbackExtra =
    fallbackCount > maxAvatars ? fallbackCount - maxAvatars : 0;

  return (
    <div className="mt-4">
      <div className="text-sm font-semibold">{t("labels.participants")}</div>
      <div className="mt-2 flex items-center gap-3 rounded-xl bg-fern/10 px-4 py-3 text-sm ring-1 ring-fern/20">
        {loading ? (
          <span className="opacity-70">{t("loadingParticipants")}</span>
        ) : showFallback ? (
          <>
            <span className="font-medium">
              {fallbackCount} {t("labels.participants")}
            </span>
          </>
        ) : (
          <>
            <div
              className="flex items-center -space-x-2"
              role="list"
              aria-label={t("labels.participants")}
            >
              {visible.map((p) => {
                const name = p.displayName?.trim() || t("fallback.neighbor");
                const initials = getInitials(name) || "•";
                return (
                  <span
                    key={p.id}
                    role="listitem"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[11px] font-semibold text-foreground ring-1 ring-fern/30"
                    aria-label={name}
                  >
                    {initials}
                  </span>
                );
              })}
              {extraCount > 0 ? (
                <span
                  role="listitem"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[11px] font-semibold text-foreground ring-1 ring-fern/30"
                  aria-label={`${extraCount} ${t("labels.participants")}`}
                >
                  +{extraCount}
                </span>
              ) : null}
            </div>
            <span className="font-medium">
              {participants.length} {t("labels.participants")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
