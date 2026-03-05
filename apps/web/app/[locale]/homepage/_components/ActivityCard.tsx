import Link from "next/link";
import type { Activity } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { SafeImage } from "@/components/ui/SafeImage";
import { useLocale, useTranslations } from "next-intl";
import { ACTIVITY_CATEGORIES, type ActivityCategory } from "@/lib/api/enums";

export function ActivityCard({ activity }: { activity: Activity }) {
  const locale = useLocale();
  const t = useTranslations("homepage.card");
  const tCategories = useTranslations("categories");
  return (
    <Link href={`/${locale}/activities/${activity.id}`}>
      <div className="rounded-md bg-surface overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="relative">
          {activity.thumbnailUrl ? (
            <div className="relative h-36 w-full">
              <SafeImage
                src={activity.thumbnailUrl}
                alt={activity.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-36 w-full bg-surface" />
          )}

          <span className="absolute right-2 top-2 rounded border border-fern bg-surface/90 px-2 py-1 text-[11px]">
            {activity.category &&
            ACTIVITY_CATEGORIES.includes(activity.category as ActivityCategory)
              ? tCategories(activity.category)
              : t("fallback")}
          </span>
        </div>

        <div className="p-3">
          <div className="text-sm font-semibold truncate">
            {activity.title ?? t("fallback")}
          </div>

          <div className="mt-2 text-xs leading-relaxed">
            <div>
              <span className="font-medium">{t("start")}:</span>{" "}
              {formatDate(activity.startAt)}
            </div>
            <div className="mt-1">
              <span className="font-medium">{t("postalCode")}:</span>{" "}
              {activity.plz ?? t("fallback")}
            </div>
            <div className="mt-1 truncate opacity-80">
              <span className="font-medium">{t("by")}:</span>{" "}
              {activity.createdBy?.displayName?.trim() || t("neighbor")}
            </div>
            <div className="mt-2 opacity-80">
              <span className="font-medium">{t("updated")}:</span>{" "}
              {formatDate(activity.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
