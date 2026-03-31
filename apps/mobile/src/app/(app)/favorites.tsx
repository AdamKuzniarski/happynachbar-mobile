import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { listFavoriteActivities, unlikeActivity, type Activity } from '@/lib/activities';
import { formatDate } from '@/lib/format';
import { FavoriteButton } from '@/components/activities/FavoriteButton';

export default function FavoritesPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadFirstPage() {
    try {
      setError(null);
      const page = await listFavoriteActivities();
      setItems(page.items ?? []);
      setNextCursor(page.nextCursor ?? null);
    } catch {
      setError('Favoriten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
  }, []);

  async function handleLoadMore() {
    if (!nextCursor || loading || refreshing || loadingMore) return;

    setLoadingMore(true);

    try {
      const page = await listFavoriteActivities({ cursor: nextCursor });
      setItems((prev) => [...prev, ...(page.items ?? [])]);
      setNextCursor(page.nextCursor ?? null);
    } catch {
      setError('Weitere Favoriten konnten nicht geladen werden.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleUnlike(activityId: string) {
    if (busyId) return;

    const previous = items;
    setBusyId(activityId);
    setItems((prev) => prev.filter((item) => item.id !== activityId));

    try {
      await unlikeActivity(activityId);
    } catch {
      setItems(previous);
    } finally {
      setBusyId(null);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFirstPage().catch(() => {});
    }, []),
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-app-dark-brand">Favoriten werden geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-dark-bg">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => {
          handleRefresh().catch(() => {});
        }}
        refreshing={refreshing}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          handleLoadMore().catch(() => {});
        }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12, flexGrow: 1 }}
        ListHeaderComponent={
          <View className="mb-2">
            <Text className="text-2xl font-bold text-app-dark-text">Favoriten</Text>
            {error ? <Text className="mt-2 text-sm text-red-300">{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-center text-base text-app-dark-brand">
              Du hast noch keine Favoriten.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <Text className="pb-3 pt-1 text-center text-xs text-app-dark-brand">
              Weitere Favoriten werden geladen...
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/activities/${item.id}`)}
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
                  liked
                  disabled={busyId === item.id}
                  onPress={() => {
                    handleUnlike(item.id).catch(() => {});
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
      />
    </SafeAreaView>
  );
}
