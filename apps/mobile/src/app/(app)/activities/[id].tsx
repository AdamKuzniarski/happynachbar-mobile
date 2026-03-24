import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityForm } from '@/components/activities/ActivityForm';
import { getAuthMe } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import {
  deleteActivity as archiveActivity,
  getActivity,
  updateActivity,
  type ActivityDetail,
  type ActivityWritePayload,
} from '@/lib/activities';
import { formatDate } from '@/lib/format';

export default function ActivityDetailPage() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const activityId =
    typeof rawId === 'string' ? rawId : Array.isArray(rawId) && rawId.length > 0 ? rawId[0] : null;

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadViewer() {
      try {
        const me = await getAuthMe();
        setViewerUserId(me.userId);
      } catch {
        setViewerUserId(null);
      }
    }

    loadViewer().catch(() => {});
  }, []);

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
      setIsEditing(false);

      try {
        const data = await getActivity(activityId);
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
  const creatorName = activity?.createdBy?.displayName?.trim() || 'Nachbar';
  const isOwner = !!activity && !!viewerUserId && activity.createdById === viewerUserId;

  async function handleUpdate(payload: ActivityWritePayload) {
    if (!activity) return;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateActivity(activity.id, payload);
      setActivity(updated);
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Aktivität konnte nicht gespeichert werden.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleArchive() {
    if (!activity || isArchiving) return;

    Alert.alert('Aktivität löschen?', 'Die Aktivität wird aus dem Feed entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => {
          setIsArchiving(true);
          setError(null);

          archiveActivity(activity.id)
            .then(() => {
              router.replace('/home');
            })
            .catch((err: unknown) => {
              const message =
                err instanceof Error ? err.message : 'Aktivität konnte nicht gelöscht werden.';
              setError(message);
            })
            .finally(() => {
              setIsArchiving(false);
            });
        },
      },
    ]);
  }

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
              'mt-4 h-11 min-w-32 items-center justify-center rounded-md bg-app-dark-accent px-5'
            }
          >
            <Text className={'font-semibold text-app-dark-text'}>Zurück</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !activity) {
    return (
      <SafeAreaView className={'flex-1 bg-app-dark-bg'}>
        <View className={'flex-1 items-center justify-center px-6'}>
          <Text className={'text-base text-app-dark-brand'}>{error}</Text>

          <Pressable
            onPress={() => setReloadKey((prev) => prev + 1)}
            className={
              'mt-4 h-11 min-w-32 items-center justify-center rounded-md bg-app-dark-accent px-5'
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
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View className={'gap-4'}>
          <Pressable
            onPress={() => router.back()}
            className={'h-11 self-start rounded-md border border-app-dark-card px-4'}
          >
            <View className={'flex-1 items-center justify-center'}>
              <Text className={'font-semibold text-app-dark-text'}>Zurück</Text>
            </View>
          </Pressable>

          {error ? <Text className="text-sm text-red-300">{error}</Text> : null}

          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              resizeMode={'cover'}
              className={'h-64 w-full rounded-md bg-app-dark-card'}
            />
          ) : (
            <View className={'h-64 w-full rounded-md bg-app-dark-card'} />
          )}

          {isOwner ? (
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setIsEditing((prev) => !prev)}
                className="h-11 flex-1 items-center justify-center rounded-md bg-app-dark-accent px-4"
              >
                <Text className="font-semibold text-app-dark-text">
                  {isEditing ? 'Bearbeiten schließen' : 'Bearbeiten'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleArchive}
                className="h-11 flex-1 items-center justify-center rounded-md border border-app-dark-card px-4"
              >
                <Text className="font-semibold text-app-dark-text">
                  {isArchiving ? 'Wird gelöscht...' : 'Löschen'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {isOwner && isEditing ? (
            <View className="rounded-md border border-app-dark-card bg-app-dark-bg p-4">
              <Text className="mb-4 text-lg font-bold text-app-dark-text">Aktivität bearbeiten</Text>
              <ActivityForm
                initialValues={{
                  title: activity.title,
                  description: activity.description,
                  plz: activity.plz,
                  category: activity.category as ActivityWritePayload['category'],
                  startAt: activity.startAt,
                  imageUrls: activity.images?.map((image) => image.url) ?? [],
                }}
                submitLabel="Änderungen speichern"
                isSubmitting={isSaving}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
              />
            </View>
          ) : null}

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

            <Text className={'leading-6 text-app-dark-brand'}>
              {activity.description?.trim() || 'Keine Beschreibung vorhanden.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
