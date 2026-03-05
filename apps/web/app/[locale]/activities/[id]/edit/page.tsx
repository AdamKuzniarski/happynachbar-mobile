import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleArrowLeft } from "lucide-react";
import type { ActivityDetail } from "@/lib/api/types";
import { CreateActivityForm } from "../../new/_components/CreateActivityForm";
import { Button } from "@/components/ui/Button";
import { getTranslations } from "next-intl/server";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:4000";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "activities" });
  const res = await fetch(`${apiBase}/activities/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (!res.ok) notFound();
  const activity = (await res.json()) as ActivityDetail;

  return (
    <main className="px-4">
      <div className="mx-auto w-full max-w-md pt-6 pb-10 sm:max-w-2xl sm:pt-10">
        <Button
          asChild
          variant="secondary"
          className="group h-7 px-2 py-0 text-[11px] leading-none"
        >
          <Link href={`/${locale}/activities/${encodeURIComponent(id)}`}>
            <CircleArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity] duration-200 ease-out group-hover:ml-2 group-hover:max-w-48 group-hover:opacity-100 group-hover:overflow-visible">
              {t("backToActivity")}
            </span>
          </Link>
        </Button>

        <div className="mt-4">
          <CreateActivityForm mode="edit" activity={activity} />
        </div>
      </div>
    </main>
  );
}
