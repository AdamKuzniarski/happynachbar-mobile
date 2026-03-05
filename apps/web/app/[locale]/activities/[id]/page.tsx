import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/format";
import type { ActivityDetail } from "@/lib/api/types";
import { ActivityImageGallery } from "./_components/ActivityImageGallery";
import { ActivityActions } from "./_components/ActivityActions";
import { JoinActivityButton } from "./_components/JoinActivityButton";
import { ParticipantsList } from "./_components/ParticipantsList";
import { ParticipantsPreview } from "./_components/ParticipantsPreview";
import { CircleArrowLeft, User } from "lucide-react";
import { StartChatButton } from "./creator/StartChatButton";
import { Button } from "@/components/ui/Button";
import { getTranslations } from "next-intl/server";
import { ACTIVITY_CATEGORIES, type ActivityCategory } from "@/lib/api/enums";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:4000";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "activities" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCategories = await getTranslations({ locale, namespace: "categories" });
  const res = await fetch(`${apiBase}/activities/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (!res.ok) notFound();
  const a = (await res.json()) as ActivityDetail;
  const images = Array.isArray(a?.images) ? a.images : [];
  const cookieStore = await cookies();
  const token = cookieStore.get("happynachbar_token")?.value;
  let currentUserId: string | undefined;
  if (token) {
    try {
      const meRes = await fetch(`${apiBase}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (meRes.ok) {
        const me = (await meRes.json()) as { id?: string };
        currentUserId = me?.id;
      }
    } catch {
    }
  }
  const isOwner = !!(
    currentUserId &&
    a?.createdById &&
    currentUserId === a.createdById
  );
  const isAuthenticated = !!currentUserId;
  const creatorHref =
    currentUserId && a?.createdById && currentUserId === a.createdById
      ? `/${locale}/profile`
      : `/${locale}/activities/${encodeURIComponent(a.id)}/creator`;
  const categoryLabel =
    a?.category && ACTIVITY_CATEGORIES.includes(a.category as ActivityCategory)
      ? tCategories(a.category)
      : tCommon("fallback");

  return (
    <main className="px-4">
      <div className="mx-auto w-full max-w-md pt-6 pb-10 sm:max-w-2xl sm:pt-10">
        <Button
          asChild
          variant="secondary"
          className="group h-7 px-2 py-0 text-[11px] leading-none"
        >
          <Link href={`/${locale}/homepage`}>
            <CircleArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity] duration-200 ease-out group-hover:ml-2 group-hover:max-w-48 group-hover:opacity-100 group-hover:overflow-visible">
              {t("backToOverview")}
            </span>
          </Link>
        </Button>

        <section className="mt-4 overflow-hidden rounded-2xl bg-surface/60 shadow-sm ring-1 ring-fern/25">
          <header className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-center sm:text-left">
                  {a?.title ?? tCommon("fallback")}
                </h1>

                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center rounded-full bg-fern/15 px-3 py-1 text-xs font-semibold ring-1 ring-fern/30">
                    {categoryLabel}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-fern/15 px-3 py-1 text-xs font-semibold ring-1 ring-fern/30">
                    {t("labels.postalCode")} {a?.plz ?? tCommon("fallback")}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <ActivityActions
                  id={a.id}
                  createdById={a.createdById}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </header>

          <div className="px-0">
            <ActivityImageGallery
              title={a?.title ?? tCommon("fallback")}
              thumbnailUrl={a?.thumbnailUrl}
              images={images}
            />
          </div>

          <div className="px-5 py-5">
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="opacity-80">{t("labels.createdBy")}</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium">
                  <span>
                    {a?.createdBy?.displayName?.trim() || t("fallback.neighbor")}
                  </span>
                  {!isOwner ? (
                    <>
                      <Link
                        href={creatorHref}
                        aria-label={t("aria.profileLink")}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-fern/50 text-foreground/80 hover:bg-fern/10 hover:text-foreground"
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <div className="inline-flex items-center">
                        <StartChatButton activityId={a.id} variant="icon" />
                      </div>
                    </>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="opacity-80">{t("labels.start")}</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(a?.startAt ?? a?.scheduledAt)}
                </dd>
              </div>
              <div>
                <dt className="opacity-80">{t("labels.updated")}</dt>

                <dd className="mt-1 font-medium">{formatDate(a?.updatedAt)}</dd>
              </div>
            </dl>

            {a?.description ? (
              <div className="mt-5">
                <div className="text-sm font-semibold">
                  {t("labels.description")}
                </div>
                <p className="mt-2 rounded-xl bg-fern/10 p-4 text-sm ring-1 ring-fern/20 break-words">
                  {a.description}
                </p>
              </div>
            ) : null}

            <div className="mt-6">
              {!isOwner ? (
                <>
                  <JoinActivityButton
                    activityId={a.id}
                    isAuthenticated={isAuthenticated}
                  />
                  <ParticipantsPreview
                    activityId={a.id}
                    participantsCount={a.participantsCount}
                    fetchParticipants={false}
                  />
                </>
              ) : null}
            </div>

            {isOwner ? (
              <>
                <ParticipantsList activityId={a.id} showGroupChat />
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
