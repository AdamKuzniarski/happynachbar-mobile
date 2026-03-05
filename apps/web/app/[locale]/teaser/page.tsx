import Link from "next/link";
import { redirect } from "next/navigation";
import { isValidPostalCode } from "@/lib/validators";
import { getTranslations } from "next-intl/server";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:4000";

type SP = { postalCode?: string | string[] };

export default async function TeaserPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teaser" });
  const raw = (await searchParams).postalCode;
  const postalCode = Array.isArray(raw) ? raw[0] : raw;

  if (!postalCode || !isValidPostalCode(postalCode)) redirect(`/${locale}`);

  const res = await fetch(
    `${apiBase}/activities?plz=${encodeURIComponent(postalCode)}&status=ACTIVE`,
    { cache: "no-store" },
  );

  const json = await res.json().catch(() => null);
  const count = Array.isArray(json?.items) ? json.items.length : 0;

  return (
    <main className="px-4">
      <div className="mx-auto w-full max-w-md pt-10 pb-12 sm:max-w-2xl sm:pt-16">
        <div className="min-h-105 rounded-4xl bg-surface px-6 py-10 shadow-lg sm:px-10 sm:py-12">
          <p className="text-center text-lg">
            {t("nearbyCount", { count })}
          </p>

          <div className="mt-12 flex justify-center">
            <Link
              href={`/${locale}/auth/register`}
              className="rounded-md border-2 border-fern bg-limecream px-5 py-3 text-base font-semibold text-evergreen hover:bg-palm hover:text-limecream transition-colors"
            >
              {t("cta")}
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-foreground/80">
            {t("postalCodeLabel")}{" "}
            <span className="font-medium">{postalCode}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
