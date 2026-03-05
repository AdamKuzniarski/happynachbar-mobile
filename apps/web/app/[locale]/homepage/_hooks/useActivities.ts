"use client";

import * as React from "react";
import { listActivities } from "@/lib/api/activities";
import type { Activity } from "@/lib/api/types";

const TAKE = 10;

export function useActivities(filters: {
  query: string;
  plz: string;
  category: string;
}) {
  const { query, plz, category } = filters;

  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadFirstPage() {
    setLoading(true);
    setError(null);
    try {
      const payload = await listActivities({
        take: TAKE,
        cursor: null,
        q: query,
        plz: plz || undefined,
        category: category || undefined,
      });
      const items = payload?.items ?? [];
      setActivities(items);
      setNextCursor(payload?.nextCursor ?? null);
      if (typeof payload?.totalCount === "number") {
        setTotalCount(payload.totalCount);
      } else {
        setTotalCount(items.length);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Unknown error");
      setActivities([]);
      setNextCursor(null);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const payload = await listActivities({
        take: TAKE,
        cursor: nextCursor,
        q: query,
        plz: plz || undefined,
        category: category || undefined,
      });
      const nextItems = payload?.items ?? [];
      setActivities((prev) => [...prev, ...nextItems]);
      setNextCursor(payload?.nextCursor ?? null);
      if (typeof payload?.totalCount === "number") {
        setTotalCount(payload.totalCount);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoadingMore(false);
    }
  }

  return {
    activities,
    nextCursor,
    totalCount,
    loading,
    loadingMore,
    error,
    loadFirstPage,
    loadMore,
  };
}
