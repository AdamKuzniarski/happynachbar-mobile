"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

type InfiniteLoadMoreProps = {
  disabled: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
};

export function InfiniteLoadMore(props: InfiniteLoadMoreProps) {
  const t = useTranslations("homepage.loadMore");
  const { disabled, loadingMore, hasMore, onLoadMore } = props;
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = React.useRef(onLoadMore);

  React.useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (disabled || loadingMore || !hasMore) return;
        onLoadMoreRef.current();
      },
      { root: null, rootMargin: "200px", threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled, hasMore, loadingMore]);

  return (
    <div className="mt-4 flex justify-center">
      <div ref={sentinelRef} className="text-xs opacity-70">
        {loadingMore
          ? t("loadingMore")
          : hasMore
            ? t("loadingNext")
            : t("noMore")}
      </div>
    </div>
  );
}
