import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listActivities, type Activity } from '@/lib/activities';
import { formatDate } from '@/lib/format';

export default function HomePage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setError(null);

    try {
      const response = await listActivities();
      setItems(response.items ?? []);
    } catch {
      setError('Aktivitäten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await listActivities();
      setItems(response.items ?? []);
    } catch {
      setError('Aktivitäten konnten nicht geladen werden.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

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
            onPress={() => {
              setLoading(true);
              void loadActivities();
            }}
            className="h-11 min-w-32 items-center justify-center rounded-md bg-app-dark-accent px-5"
          >
            <Text className="font-semibold text-app-dark-text">Erneut versuchen</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-app-dark-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-app-dark-brand">
            Es wurden noch keine Aktivitäten gefunden.
          </Text>
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
          void handleRefresh();
        }}
        refreshing={refreshing}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <Text className="mb-1 text-xs text-app-dark-brand">
            {refreshing
              ? 'Aktualisiere Aktivitäten...'
              : 'Ziehe nach unten, um die Aktivitäten zu aktualisieren.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View className="rounded-md border border-app-dark-card bg-app-dark-bg p-4">
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
          </View>
        )}
      />
    </SafeAreaView>
  );
}
