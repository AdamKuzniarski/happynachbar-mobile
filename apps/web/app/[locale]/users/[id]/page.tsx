import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { getTranslations } from "next-intl/server";
import { StartChatButton } from "./StartChatButton";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:4000";

type PublicProfile = {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  plz?: string | null;
  createdAt?: string | null;
};

function getInitials(name?: string | null) {
  if (!name) return "N";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "N";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "N";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "activities" });
  const res = await fetch(
    `${apiBase}/public/users/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );

  if (!res.ok) notFound();
  const profile = (await res.json()) as PublicProfile;

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

        <section className="mt-4 rounded-md border-2 border-fern bg-surface p-4 shadow-sm sm:p-6">
          <h1 className="text-lg font-semibold text-center">
            {t("creator.profileTitle")}
          </h1>

          <div className="mt-4 flex flex-col items-center text-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-fern bg-surface-strong text-2xl font-semibold text-foreground">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={t("creator.avatarAlt", { name: profile.displayName })}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {getInitials(profile.displayName)}
                </div>
              )}
            </div>
            <div className="mt-3 text-base font-semibold">
              {profile.displayName || t("fallback.neighbor")}
            </div>
          </div>

          <div className="mt-6 rounded-md border-2 border-fern bg-surface p-3 text-sm">
            <dl className="space-y-2">
              <div>
                <dt className="text-xs opacity-80">{t("labels.bio")}</dt>
                <dd className="text-sm text-foreground">
                  {profile.bio?.trim() || t("fallback.noBio")}
                </dd>
              </div>
              <div>
                <dt className="text-xs opacity-80">
                  {t("labels.postalCode")}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {profile.plz?.trim() || t("fallback.empty")}
                </dd>
              </div>
              <div>
                <dt className="text-xs opacity-80">
                  {t("labels.memberSince")}
                </dt>
                <dd className="text-sm text-foreground">
                  {profile.createdAt
                    ? formatDate(profile.createdAt)
                    : t("fallback.empty")}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <StartChatButton userId={id} />
          </div>
        </section>
      </div>
    </main>
  );
}
