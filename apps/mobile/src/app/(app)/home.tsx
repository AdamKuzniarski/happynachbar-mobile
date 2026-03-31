import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import {
  listActivities,
  getActivityLikeStatus,
  likeActivity,
  unlikeActivity,
  type Activity,
} from '@/lib/activities';
import { formatDate } from '@/lib/format';
import { ActivityCategory } from '@/lib/enums';
import { HomeListHeader } from '@/components/home/HomeListHeader';
import { FavoriteButton } from '@/components/activities/FavoriteButton';

export default function HomePage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const loadingRef = useRef(loading);
  const selectedCategoryRef = useRef(selectedCategory);
  const searchValueRef = useRef(searchValue);
  const [isCategoryVisible, setIsCategoryVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);

  async function loadLikedIdsForItems(nextItems: Activity[]) {
    const likedResults = await Promise.all(
      nextItems.map(async (item) => {
        try {
          const result = await getActivityLikeStatus(item.id);
          return result.liked ? item.id : null;
        } catch {
          return null;
        }
      }),
    );

    return new Set(likedResults.filter((value): value is string => !!value));
  }

  async function toggleFavorite(activityId: string) {
    if (favoriteBusyId) return;

    const wasLiked = likedIds.has(activityId);
    setFavoriteBusyId(activityId);

    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });

    try {
      if (wasLiked) {
        await unlikeActivity(activityId);
      } else {
        await likeActivity(activityId);
      }
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) {
          next.add(activityId);
        } else {
          next.delete(activityId);
        }
        return next;
      });
    } finally {
      setFavoriteBusyId(null);
    }
  }

  async function loadFirstPage(category: ActivityCategory | null, search: string) {
    setError(null);

    try {
      const page = await listActivities({ category, q: search });
      const nextLikedIds = await loadLikedIdsForItems(page.items ?? []);

      setItems(page.items ?? []);
      setNextCursor(page.nextCursor ?? null);
      setLikedIds(nextLikedIds);
    } catch {
      setError('Aktivitäten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const page = await listActivities({ category: selectedCategory, q: searchValue });
      const nextLikedIds = await loadLikedIdsForItems(page.items ?? []);

      setItems(page.items ?? []);
      setNextCursor(page.nextCursor ?? null);
      setLikedIds(nextLikedIds);
    } catch {
      setError('Aktivitäten konnten nicht geladen werden.');
    } finally {
      setRefreshing(false);
    }
  }, [searchValue, selectedCategory]);

  async function handleLoadMore() {
    if (!nextCursor || loading || refreshing || loadingMore) return;

    setLoadingMore(true);

    try {
      const page = await listActivities({
        cursor: nextCursor,
        category: selectedCategory,
        q: searchValue,
      });

      const moreItems = page.items ?? [];
      const moreLikedIds = await loadLikedIdsForItems(moreItems);

      setItems((prev) => [...prev, ...moreItems]);
      setNextCursor(page.nextCursor ?? null);
      setLikedIds((prev) => {
        const next = new Set(prev);
        moreLikedIds.forEach((id) => next.add(id));
        return next;
      });
    } catch {
      setError('Weitere Aktivitäten konnten nicht geladen werden.');
    } finally {
      setLoadingMore(false);
    }
  }

  function onRefreshList() {
    handleRefresh().catch(() => {});
  }

  function onReachListEnd() {
    handleLoadMore().catch(() => {});
  }

  function onRetryFirstPage() {
    setLoading(true);
    setLoadingMore(false);
    setRefreshing(false);
    loadFirstPage(selectedCategory, searchValue).catch(() => {});
  }

  function openActivityDetails(activityId: string) {
    router.push(`/activities/${activityId}`);
  }

  function onSelectedCategory(category: ActivityCategory | null) {
    setSelectedCategory(category);
  }

  function onListScroll(event: { nativeEvent: { contentOffset: { y: number } } }) {
    const currentY = Math.max(0, event.nativeEvent.contentOffset.y);

    if (currentY <= 4) {
      setIsCategoryVisible(true);
      setLastScrollY(currentY);
      return;
    }

    if (currentY > lastScrollY + 2) {
      setIsCategoryVisible(false);
    } else if (currentY < lastScrollY - 2) {
      setIsCategoryVisible(true);
    }

    setLastScrollY(currentY);
  }

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    searchValueRef.current = searchValue;
  }, [searchValue]);

  useFocusEffect(
    useCallback(() => {
      if (loadingRef.current) return;

      setRefreshing(true);
      setError(null);

      listActivities({
        category: selectedCategoryRef.current,
        q: searchValueRef.current,
      })
        .then(async (page) => {
          const nextLikedIds = await loadLikedIdsForItems(page.items ?? []);
          setItems(page.items ?? []);
          setNextCursor(page.nextCursor ?? null);
          setLikedIds(nextLikedIds);
        })
        .catch(() => {
          setError('Aktivitäten konnten nicht geladen werden.');
        })
        .finally(() => {
          setRefreshing(false);
        });
    }, []),
  );

  useEffect(() => {
    let cancelled = false;

    setLoadingMore(false);
    setRefreshing(false);

    const timeout = setTimeout(async () => {
      try {
        const page = await listActivities({ category: selectedCategory, q: searchValue });
        const nextLikedIds = await loadLikedIdsForItems(page.items ?? []);

        if (cancelled) return;

        setError(null);
        setItems(page.items ?? []);
        setNextCursor(page.nextCursor ?? null);
        setLikedIds(nextLikedIds);
      } catch {
        if (cancelled) return;
        setError('Aktivitäten konnten nicht geladen werden.');
      } finally {
        if (cancelled) return;

        setLoading(false);
        setRefreshing(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [selectedCategory, searchValue]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-app-dark-brand">Aktivitäten werden geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-center text-base text-app-dark-brand">{error}</Text>
          <Pressable
            onPress={onRetryFirstPage}
            className="h-11 min-w-32 items-center justify-center rounded-md bg-app-dark-accent px-5"
          >
            <Text className="font-semibold text-app-dark-text">Erneut versuchen</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <View className="px-4 pt-4">
        <HomeListHeader
          searchValue={searchValue}
          onChangeSearch={setSearchValue}
          selectedCategory={selectedCategory}
          onChangeCategory={onSelectedCategory}
          categoryVisible={isCategoryVisible}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={onRefreshList}
        refreshing={refreshing}
        onEndReachedThreshold={0.4}
        onEndReached={onReachListEnd}
        onScroll={onListScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-center text-base text-app-dark-brand">
              Es wurden keine Aktivitäten gefunden.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openActivityDetails(item.id)}
            className="rounded-md border border-app-dark-card bg-app-dark-bg p-4"
          >
            <View className="relative">
              {item.thumbnailUrl ? (
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  resizeMode="cover"
                  className="mb-3 h-44 w-full rounded-md bg-app-dark-card"
                />
              ) : (
                <View className="mb-3 h-44 w-full rounded-md bg-app-dark-card" />
              )}

              <View className="absolute right-2 top-2">
                <FavoriteButton
                  liked={likedIds.has(item.id)}
                  disabled={favoriteBusyId === item.id}
                  onPress={() => {
                    toggleFavorite(item.id).catch(() => {});
                  }}
                />
              </View>
            </View>

            <Text className="text-lg font-bold text-app-dark-text">{item.title}</Text>

            <Text className="mt-2 text-sm text-app-dark-brand">
              Kategorie: {item.category || '—'}
            </Text>

            <Text className="mt-1 text-sm text-app-dark-brand">PLZ: {item.plz || '—'}</Text>

            <Text className="mt-1 text-sm text-app-dark-brand">
              Start: {formatDate(item.startAt)}
            </Text>

            <Text className="mt-1 text-sm text-app-dark-brand">
              Von: {item.createdBy?.displayName?.trim() || 'Neighbor'}
            </Text>
          </Pressable>
        )}
        ListFooterComponent={
          loadingMore ? (
            <Text className="pb-3 pt-1 text-center text-xs text-app-dark-brand">
              Weitere Aktivitäten werden geladen...
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
