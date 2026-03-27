import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { ApiError } from '@/lib/api';
import { getAuthMe } from '@/lib/auth';
import {
  deleteActivity as archiveActivity,
  getActivity,
  updateActivity,
  type ActivityDetail,
  type ActivityWritePayload,
} from '@/lib/activities';

type Props = {
  activityId: string | null;
  onActivityLoaded?: (activity: ActivityDetail) => void;
};

export function useActivityDetailScreen({ activityId, onActivityLoaded }: Props) {
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
        onActivityLoaded?.(data);
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
  }, [activityId, onActivityLoaded, reloadKey]);

  async function handleUpdate(payload: ActivityWritePayload) {
    if (!activity) return;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateActivity(activity.id, payload);
      setActivity(updated);
      setIsEditing(false);
      onActivityLoaded?.(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Aktivität konnte nicht gespeichert werden.';
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

  const isOwner = !!activity && !!viewerUserId && activity.createdById === viewerUserId;

  return {
    activity,
    viewerUserId,
    loading,
    isEditing,
    isSaving,
    isArchiving,
    error,
    notFound,
    isOwner,
    setError,
    setIsEditing,
    setReloadKey,
    handleUpdate,
    handleArchive,
  };
}
