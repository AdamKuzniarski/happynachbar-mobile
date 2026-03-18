import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { listActivities, type Activity } from '@/lib/activities';
import { formatDate } from '@/lib/format';
import { ActivityCategory } from '@/lib/enums';
import { HomeListHeader } from '@/components/home/HomeListHeader';

export default function HomePage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
  const [searchValue, setSearchValue] = useState('');

  async function loadFirstPage(category: ActivityCategory | null, search: string) {
    setError(null);

    try {
      const page = await listActivities({ category, q: search });
      setItems(page.items ?? []);
      setNextCursor(page.nextCursor ?? null);
    } catch {
      setError('Aktivitäten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);

    try {
      const page = await listActivities({ category: selectedCategory, q: searchValue });
      setItems(page.items ?? []);
      setNextCursor(page.nextCursor ?? null);
    } catch {
      setError('Aktivitäten konnten nicht geladen werden.');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLoadMore() {
    if (!nextCursor || loading || refreshing || loadingMore) return;

    setLoadingMore(true);

    try {
      const page = await listActivities({
        cursor: nextCursor,
        category: selectedCategory,
        q: searchValue,
      });

      setItems((prev) => [...prev, ...(page.items ?? [])]);
      setNextCursor(page.nextCursor ?? null);
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

  useEffect(() => {
    setLoadingMore(false);
    setRefreshing(false);

    const timeout = setTimeout(() => {
      loadFirstPage(selectedCategory, searchValue).catch(() => {});
    }, 300);

    return () => clearTimeout(timeout);
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
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={onRefreshList}
        refreshing={refreshing}
        onEndReachedThreshold={0.4}
        onEndReached={onReachListEnd}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        ListHeaderComponent={
          <HomeListHeader
            searchValue={searchValue}
            onChangeSearch={setSearchValue}
            selectedCategory={selectedCategory}
            onChangeCategory={onSelectedCategory}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-center text-base text-app-dark-brand">
              Es wurden keine Aktivitäten gefunden.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <Text className="pb-3 pt-1 text-center text-xs text-app-dark-brand">
              Weitere Aktivitäten werden geladen...
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openActivityDetails(item.id)}
            className="rounded-md border border-app-dark-card bg-app-dark-bg p-4"
          >
            {item.thumbnailUrl ? (
              <Image
                source={{ uri: item.thumbnailUrl }}
                resizeMode="cover"
                className="mb-3 h-44 w-full rounded-md bg-app-dark-card"
              />
            ) : (
              <View className="mb-3 h-44 w-full rounded-md bg-app-dark-card" />
            )}

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
      />
    </SafeAreaView>
  );
}
