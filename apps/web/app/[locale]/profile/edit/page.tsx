import Link from "next/link";
import { cookies } from "next/headers";
import { CircleArrowLeft } from "lucide-react";
import { ProfileEditForm } from "./_components/ProfileEditForm";
import { Button } from "@/components/ui/Button";
import { getTranslations } from "next-intl/server";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:4000";

type UserMeResponse = {
  profile: {
    displayName?: string | null;
    plz?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
  } | null;
};

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  const cookieStore = await cookies();
  const token = cookieStore.get("happynachbar_token")?.value;

  let error: string | null = null;
  let profile: UserMeResponse["profile"] = null;

  if (!token) {
    error = t("errors.notLoggedInEdit");
  } else {
    try {
      const res = await fetch(`${apiBase}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        error = t("errors.loadFailed");
      } else {
        const me = (await res.json()) as UserMeResponse;
        profile = me?.profile ?? null;
      }
    } catch {
      error = t("errors.loadFailed");
    }
  }

  return (
    <main className="px-4">
      <div className="mx-auto w-full max-w-md pt-6 pb-10 sm:max-w-2xl sm:pt-10">
        <Button
          asChild
          variant="secondary"
          className="group h-7 px-2 py-0 text-[11px] leading-none"
        >
          <Link href={`/${locale}/profile`}>
            <CircleArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity] duration-200 ease-out group-hover:ml-2 group-hover:max-w-48 group-hover:opacity-100 group-hover:overflow-visible">
              {t("backToOverview")}
            </span>
          </Link>
        </Button>

        <section className="mt-4 rounded-md border-2 border-fern bg-surface p-4 shadow-sm sm:p-6">
          <h1 className="text-lg font-semibold text-center">
            {t("editTitle")}
          </h1>

          {error ? (
            <div className="mt-4 rounded-md border-2 border-fern bg-surface p-3 text-sm">
              <p>{error}</p>
              <Link
                href={`/${locale}/auth/login`}
                className="mt-3 inline-flex text-sm font-semibold underline"
              >
                {t("loginCta")}
              </Link>
            </div>
          ) : (
            <ProfileEditForm
              initial={{
                displayName: profile?.displayName ?? "",
                plz: profile?.plz ?? "",
                avatarUrl: profile?.avatarUrl ?? "",
                bio: profile?.bio ?? "",
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
