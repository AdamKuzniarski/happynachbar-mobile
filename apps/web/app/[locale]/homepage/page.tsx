"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { FiltersBar } from "./_components/FilterBar";
import { ActivitiesSection } from "./_components/ActivitiesSection";
import { useActivities } from "./_hooks/useActivities";
import { defaultLocale, isLocale } from "@/lib/i18n";

export default function HomepagePage() {
  const router = useRouter();
  const params = useParams();
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [plz, setPlz] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const {
    activities,
    nextCursor,
    totalCount,
    loading,
    loadingMore,
    error,
    loadFirstPage,
    loadMore,
  } = useActivities({ query, plz, category });

  React.useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch() {
    loadFirstPage();
  }

  async function handleCreateActivity() {
    setCreating(true);
    try {
      router.push(`/${locale}/activities/new`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="px-4">
      <div className="mx-auto w-full max-w-md pt-6 pb-10 sm:max-w-2xl lg:max-w-5xl sm:pt-10">
        <FiltersBar
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          plz={plz}
          setPlz={setPlz}
          loading={loading}
          onSearch={handleSearch}
        />

        <ActivitiesSection
          activities={activities}
          loading={loading}
          error={error}
          creating={creating}
          onCreate={handleCreateActivity}
          onLoadMore={loadMore}
          hasMore={!!nextCursor}
          loadingMore={loadingMore}
          totalCount={totalCount}
        />
      </div>
    </main>
  );
}
