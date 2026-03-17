import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@/lib/api';
import { getActivitiy, type ActivityDetail } from '@/lib/activities';
import { formatDate } from '@/lib/format';

export default function ActivityDetailPage() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const activityId =
    typeof rawId === 'string' ? rawId : Array.isArray(rawId) && rawId.length > 0 ? rawId[0] : null;

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function run() {
      if (!activityId) {
        setActivity(null);
        setError(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const data = await getActivitiy(activityId);
        setActivity(data);
      } catch (err) {
        const apiError = err as ApiError;

        setActivity(null);

        if (apiError?.status === 404) {
          setNotFound(true);
        } else {
          setError('Aktivität konnte nicht geladen werden.');
        }
      } finally {
        setLoading(false);
      }
    }

    run().catch(() => {});
  }, [activityId, reloadKey]);

  const imageUrl = activity?.images?.[0]?.url ?? activity?.thumbnailUrl ?? null;
  const creatorName = activity?.createdBy?.displayName?.trim() || 'Neighbor';

  if (loading) {
    return (
      <SafeAreaView className={'flex-1 bg-app-dark-bg'}>
        <View className={'flex-1 items-center justify-center px-6'}>
          <Text className={'text-base text-app-dark-brand'}>Aktivität wird geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView className={'flex-1 bg-app-dark-bg'}>
        <View className={'flex-1 items-center justify-center px-6'}>
          <Text className={'text-base text-app-dark-brand'}>
            Diese Aktivität wurde nicht gefunden.
          </Text>

          <Pressable
            onPress={() => router.back()}
            className={
              'h-11 min-w-32 items-center justify-center rounded-md bg-app-dark-accent px-5'
            }
          >
            <Text className={'font-semibold text-app-dark-text'}>Zurück</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className={'flex-1 bg-app-dark-bg'}>
        <View className={'flex-1 items-center justify-center px-6'}>
          <Text className={'text-base text-app-dark-brand'}>{error}</Text>

          <Pressable
            onPress={() => setReloadKey((prev) => prev + 1)}
            className={
              'h-11 min-w-32 items-center justify-center rounded-md bg-app-dark-accent px-5'
            }
          >
            <Text className={'font-semibold text-app-dark-text'}>Erneut versuchen</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return null;
  }
  return (
    <SafeAreaView className={'flex-1 bg-app-dark-bg'}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className={'gap-4'}>
          <Pressable
            onPress={() => router.back()}
            className={'h-11 self-start rounded-md border border-app-dark-card px-4'}
          >
            <View className={'flex-1 items-center justify-center'}>
              <Text className={'font-semibold text-app-dark-text'}>Zurück</Text>
            </View>
          </Pressable>

          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              resizeMode={'cover'}
              className={'h-64 w-full rounded-md bg-app-dark-card'}
            />
          ) : (
            <View className={'h-64 w-full rounded-md bg-app-dark-card'} />
          )}

          <View className={'rounded-md border border-app-dark-card bg-app-dark-bg p-4'}>
            <Text className={'text-2xl font-bold text-app-dark-text'}>{activity.title}</Text>

            <View className={'mt-4 gap-2'}>
              <Text className={'text-sm text-app-dark-brand'}>
                Kategorie: {activity.category || '—'}
              </Text>
            </View>
            <View>
              <Text className={'text-sm text-app-dark-brand'}>PLZ: {activity.plz || '—'}</Text>
            </View>
            <View>
              <Text className={'text-sm text-app-dark-brand'}>Von: {creatorName}</Text>
            </View>
            <View>
              <Text className={'text-sm text-app-dark-brand'}>
                Start: {formatDate(activity.startAt)}
              </Text>
            </View>
            <View>
              <Text className={'text-sm text-app-dark-brand'}>
                Aktualisiert: {formatDate(activity.updatedAt)}
              </Text>
            </View>
          </View>
          <View className={'rounded-md border border-app-dark-card bg-app-dark-bg p-4'}>
            <Text className={'mb-2 text-base font-semibold text-app-dark-text'}>Beschreibung</Text>

            <Text className={'text-md leading-6 text-app-dark-brand'}>
              {activity.description?.trim() || 'Keine Beschreibung vorhanden.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
