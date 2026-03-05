import Link from "next/link";
import { cookies } from "next/headers";
import { CircleArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { getTranslations } from "next-intl/server";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:4000";

type UserProfile = {
  displayName?: string | null;
  plz?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
};

type UserMeResponse = {
  id: string;
  email: string;
  createdAt?: string;
  profile: UserProfile | null;
  profileCompletion?: {
    isComplete: boolean;
    percent: number;
    missing: string[];
  };
};

function getInitials(name?: string | null) {
  if (!name) return "N";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "N";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "N";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  const cookieStore = await cookies();
  const token = cookieStore.get("happynachbar_token")?.value;
  let me: UserMeResponse | null = null;
  let error: string | null = null;

  if (!token) {
    error = t("errors.notLoggedIn");
  } else {
    try {
      const res = await fetch(`${apiBase}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        error = t("errors.loadFailed");
      } else {
        me = (await res.json()) as UserMeResponse;
      }
    } catch {
      error = t("errors.loadFailed");
    }
  }

  const profile = me?.profile ?? null;
  const displayName = profile?.displayName?.trim() || t("fallback.neighbor");
  const avatarUrl = profile?.avatarUrl?.trim() || "";
  const plz = profile?.plz?.trim() || t("fallback.empty");
  const bio = profile?.bio?.trim() || t("fallback.noBio");
  const completion = me?.profileCompletion;
  const completionPercent = Math.max(
    0,
    Math.min(100, completion?.percent ?? 0),
  );
  const joinedAt = me?.createdAt ? formatDate(me.createdAt) : t("fallback.empty");

  return (
    <main className="px-4">
      <div className="mx-auto w-full max-w-md pt-6 pb-10 sm:max-w-2xl sm:pt-10">
        <div className="mb-4">
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
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h1 className="text-xl font-semibold sm:text-2xl text-center">
            {t("title")}
          </h1>
        </div>

        <section className="mt-4 overflow-hidden rounded-2xl bg-surface/60 shadow-sm ring-1 ring-fern/25">
          {error ? (
            <div className="px-5 py-5 text-sm">
              <p>{error}</p>
              <Link
                href={`/${locale}/auth/login`}
                className="mt-3 inline-flex text-sm font-semibold underline"
              >
                {t("loginCta")}
              </Link>
            </div>
          ) : (
            <div className="px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-[200px,1fr]">
                <div className="rounded-xl bg-fern/10 p-4 ring-1 ring-fern/20 flex flex-col items-center text-center">
                  <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-fern bg-surface-strong text-3xl font-semibold text-foreground">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={t("avatarAlt", { name: displayName })}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {getInitials(displayName)}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-base font-semibold">
                    {displayName}
                  </div>
                  <div className="text-xs text-foreground/80">
                    {me?.email ?? ""}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl bg-fern/10 p-4 text-sm ring-1 ring-fern/20">
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs opacity-80">
                          {t("labels.displayName")}
                        </dt>
                        <dd className="text-sm font-medium text-foreground">
                          {displayName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs opacity-80">
                          {t("labels.postalCode")}
                        </dt>
                        <dd className="text-sm font-medium text-foreground">
                          {plz}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs opacity-80">
                          {t("labels.bio")}
                        </dt>
                        <dd className="text-sm font-medium text-foreground">
                          {bio}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs opacity-80">
                          {t("labels.memberSince")}
                        </dt>
                        <dd className="text-sm font-medium text-foreground">
                          {joinedAt}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {!completion?.isComplete ? (
                    <div className="rounded-xl bg-fern/10 p-3 ring-1 ring-fern/20">
                      <div className="text-sm font-medium text-foreground">
                        {t("status.title")}
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
                        <div
                          className="h-full bg-fern"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                      <div className="mt-1.5 text-[11px] text-hunter">
                        {t("status.completion", { percent: completionPercent })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </section>

        {!error ? (
          <div className="mt-6 flex flex-col items-center gap-2">
            <Link
              href={`/${locale}/profile/edit`}
              className="inline-flex items-center justify-center rounded-md border-2 border-fern bg-surface px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-strong"
            >
              {t("editCta")}
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
