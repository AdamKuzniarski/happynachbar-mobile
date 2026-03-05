import type { Activity } from "@/lib/api/types";
import { ActivityGrid } from "./ActivityGrid";
import { InfiniteLoadMore } from "./InfiniteLoadMore";
import { useTranslations } from "next-intl";

type ActivitySectionProps = {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  onCreate: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  totalCount: number;
};

export function ActivitiesSection(props: ActivitySectionProps) {
  const t = useTranslations("homepage.section");
  const tCommon = useTranslations("common");
  const {
    activities,
    loading,
    error,
    creating,
    onCreate,
    onLoadMore,
    hasMore,
    loadingMore,
    totalCount,
  } = props;

  return (
    <section className="mx-auto mt-6 w-full max-w-md sm:max-w-2xl">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-foreground">{t("title")}</h2>
        <span className="text-xs ">
          {loading
            ? tCommon("loading")
            : t("suggestions", { count: totalCount })}
        </span>
      </div>

      {error && (
        <div className="mt-3 rounded-md border-2 border-fern bg-surface p-3 text-sm">
          {t("loadError", { error })}
        </div>
      )}

      {!loading && !error && activities.length === 0 && (
        <div className="mt-3 rounded-md border-2 border-fern bg-surface p-3 text-sm">
          {t("empty")}
        </div>
      )}

      {!loading && (
        <>
          <ActivityGrid
            activities={activities}
            creating={creating}
            onCreate={onCreate}
          />
          <InfiniteLoadMore
            onLoadMore={onLoadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
            disabled={!hasMore || loadingMore || loading}
          />
        </>
      )}
    </section>
  );
}
