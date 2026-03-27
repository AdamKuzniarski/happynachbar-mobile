import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityDescriptionSection } from '@/components/activities/ActivityDescriptionSection';
import { ActivityEditPanel } from '@/components/activities/ActivityEditPanel';
import { ActivityHero } from '@/components/activities/ActivityHero';
import { ActivityMetaSection } from '@/components/activities/ActivityMetaSection';
import { ActivityOwnerActions } from '@/components/activities/ActivityOwnerActions';
import { getAuthMe } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { openGroupConversation } from '@/lib/chat';
import {
  deleteActivity as archiveActivity,
  getActivity,
  getActivityJoinStatus,
  joinActivity,
  leaveActivity,
  listActivityParticipants,
  updateActivity,
  type ActivityParticipant,
  type ActivityDetail,
  type ActivityWritePayload,
} from '@/lib/activities';
import { formatDate } from '@/lib/format';

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '•';
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '•';
}

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
  const [openingChat, setOpeningChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [joined, setJoined] = useState(false);
  const [checkingJoinStatus, setCheckingJoinStatus] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const { width } = useWindowDimensions();

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
      setJoinError(null);
      setChatError(null);
      setParticipants([]);
      setParticipantsError(null);

      try {
        const data = await getActivity(activityId);
        setActivity(data);
        setJoined(!!data.isJoined);
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

  const imageUrls = activity?.images?.map((image) => image.url).filter(Boolean) ?? [];
  const galleryImages =
    imageUrls.length > 0 ? imageUrls : activity?.thumbnailUrl ? [activity.thumbnailUrl] : [];
  const galleryImageWidth = Math.max(width - 32, 280);
  const creatorName = activity?.createdBy?.displayName?.trim() || 'Nachbar';
  const isOwner = !!activity && !!viewerUserId && activity.createdById === viewerUserId;

  function handleGalleryScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!galleryImages.length) return;

    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / galleryImageWidth);
    const clampedIndex = Math.max(0, Math.min(nextIndex, galleryImages.length - 1));
    setCurrentImageIndex(clampedIndex);
  }

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activity?.id, galleryImages.length]);

  useEffect(() => {
    if (!activityId || !activity || !viewerUserId || isOwner) {
      setCheckingJoinStatus(false);
      setJoined(!!activity?.isJoined);
      return;
    }

    let active = true;
    setCheckingJoinStatus(true);

    getActivityJoinStatus(activityId)
      .then((res) => {
        if (!active) return;
        setJoined(!!res.joined);
      })
      .catch(() => {
        if (!active) return;
        setJoinError('Teilnahmestatus konnte nicht geladen werden.');
      })
      .finally(() => {
        if (!active) return;
        setCheckingJoinStatus(false);
      });

    return () => {
      active = false;
    };
  }, [activityId, activity, viewerUserId, isOwner]);

  useEffect(() => {
    if (!activityId || !viewerUserId || !isOwner) {
      setParticipants([]);
      setParticipantsLoading(false);
      setParticipantsError(null);
      return;
    }

    let active = true;
    setParticipantsLoading(true);
    setParticipantsError(null);

    listActivityParticipants(activityId)
      .then((rows) => {
        if (!active) return;
        setParticipants(rows);
      })
      .catch((nextError) => {
        if (!active) return;
        setParticipants([]);
        setParticipantsError(
          nextError instanceof Error
            ? nextError.message
            : 'Teilnehmende konnten nicht geladen werden.',
        );
      })
      .finally(() => {
        if (!active) return;
        setParticipantsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activityId, viewerUserId, isOwner]);

  async function handleUpdate(payload: ActivityWritePayload) {
    if (!activity) return;

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateActivity(activity.id, payload);
      setActivity(updated);
      setIsEditing(false);
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

  async function onOpenGroupChat() {
    if (!activityId || openingChat || !canAccessGroupChat) return;

    setOpeningChat(true);
    setChatError(null);

    try {
      const conversation = await openGroupConversation(activityId);
      router.push({
        pathname: '/(app)/messages/[id]',
        params: { id: conversation.id },
      });
    } catch (nextError) {
      setChatError(
        nextError instanceof Error
          ? nextError.message
          : 'Gruppenchat konnte nicht geöffnet werden.',
      );
    } finally {
      setOpeningChat(false);
    }
  }

  async function handleJoin() {
    if (!activityId || joining || leaving || checkingJoinStatus) return;

    if (!viewerUserId) {
      setJoinError('Bitte logge dich ein, um teilzunehmen.');
      return;
    }

    setJoinError(null);
    setJoining(true);

    try {
      await joinActivity(activityId);
      setJoined(true);
      setActivity((current) =>
        current
          ? {
              ...current,
              isJoined: true,
              participantsCount: (current.participantsCount ?? 0) + 1,
            }
          : current,
      );
    } catch (nextError) {
      setJoinError(
        nextError instanceof Error
          ? nextError.message
          : 'Teilnahme konnte nicht gespeichert werden.',
      );
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (!activityId || leaving || joining || checkingJoinStatus) return;

    setJoinError(null);
    setLeaving(true);

    try {
      await leaveActivity(activityId);
      setJoined(false);
      setActivity((current) =>
        current
          ? {
              ...current,
              isJoined: false,
              participantsCount: Math.max((current.participantsCount ?? 1) - 1, 0),
            }
          : current,
      );
      setChatError(null);
    } catch (nextError) {
      setJoinError(
        nextError instanceof Error ? nextError.message : 'Teilnahme konnte nicht entfernt werden.',
      );
    } finally {
      setLeaving(false);
    }
  }

  const canAccessGroupChat = isOwner || joined;
  const participantsCount = activity.participantsCount ?? 0;
  const previewParticipants = participants.slice(0, 3);

  return (
    <SafeAreaView className={'flex-1 bg-app-dark-bg'}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View className={'gap-4'}>
          <Pressable
            onPress={() => router.back()}
            className={'self-start flex-row rounded-md px-3 py-2'}
          >
            <View className={'flex-row items-center gap-2'}>
              <Ionicons name="arrow-back-outline" size={16} color="#F3F6EE" />
              <Text className={'text-sm font-semibold text-app-dark-text'}>Zurück</Text>
            </View>
          </Pressable>

          {error ? <Text className="text-sm text-red-300">{error}</Text> : null}

          {!isEditing ? (
            <>
              <ActivityHero
                title={activity.title}
                category={activity.category || '—'}
                galleryImages={galleryImages}
                galleryImageWidth={galleryImageWidth}
                currentImageIndex={currentImageIndex}
                onGalleryScroll={handleGalleryScroll}
              />

              {isOwner ? (
                <ActivityOwnerActions
                  onArchive={handleArchive}
                  onEdit={() => setIsEditing((prev) => !prev)}
                />
              ) : null}
            </>
          ) : null}

          {isOwner && isEditing ? (
            <ActivityEditPanel
              activity={activity}
              isSaving={isSaving}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : null}

          {!isEditing ? (
            <>
              <ActivityMetaSection
                startAt={activity.startAt}
                plz={activity.plz}
                creatorName={creatorName}
                updatedAt={activity.updatedAt}
                formatDate={formatDate}
              />

              <ActivityDescriptionSection description={activity.description} />

              {!isOwner ? (
                <View className={'rounded-md bg-app-dark-bg p-4'}>
                  <Text className={'mb-3 text-base font-semibold text-app-dark-text'}>
                    Teilnahme
                  </Text>
                  {joinError ? (
                    <Text className="mb-3 text-sm text-red-300">{joinError}</Text>
                  ) : null}

                  {joined ? (
                    <View className="gap-3 rounded-3xl bg-app-dark-card/80 p-4">
                      <View className="flex-row items-center gap-3">
                        <View className="h-11 w-11 items-center justify-center rounded-full bg-app-dark-accent">
                          <Ionicons name="checkmark" size={18} color="#203321" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-app-dark-text">
                            Du nimmst teil
                          </Text>
                          <Text className="mt-1 text-xs text-app-dark-brand">
                            Du bist in der Teilnehmerliste und hast Zugriff auf den Gruppenchat.
                          </Text>
                        </View>
                      </View>

                      <View className="self-start flex-row items-center gap-2 rounded-full bg-app-dark-bg/70 px-3 py-2">
                        <View className="flex-row">
                          {Array.from({
                            length: Math.min(
                              Math.max(participantsCount, previewParticipants.length),
                              3,
                            ),
                          }).map((_, index) => {
                            const participant = previewParticipants[index];
                            const label = participant?.displayName?.trim() || 'Nachbar';
                            return (
                              <View
                                key={participant?.id ?? `joined-fallback-${index}`}
                                className={`h-7 w-7 items-center justify-center rounded-full border border-app-dark-brand bg-app-dark-bg ${
                                  index > 0 ? '-ml-2' : ''
                                }`}
                              >
                                <Text className="text-[11px] font-semibold text-app-dark-text">
                                  {participant ? getInitials(label) : '•'}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                        <Text className="text-sm font-semibold text-app-dark-text">
                          {participantsCount} Teilnehmende
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => {
                          onOpenGroupChat().catch(() => {});
                        }}
                        disabled={openingChat}
                        className="self-end flex-row items-center justify-center rounded-full bg-app-dark-bg/70 px-3 py-2"
                      >
                        <Ionicons name="chatbubble-outline" size={13} color="#B8C3AF" />
                        <Text className={'ml-1.5 text-xs font-semibold text-app-dark-text'}>
                          {openingChat ? 'Gruppenchat wird geöffnet...' : 'Gruppenchat öffnen'}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          handleLeave().catch(() => {});
                        }}
                        disabled={leaving || openingChat}
                        className="self-start flex-row items-center justify-center rounded-full bg-app-dark-bg/70 px-2.5 py-1.5"
                      >
                        <Ionicons name="person-remove-outline" size={13} color="#F3F6EE" />
                        <Text className="ml-1.5 text-xs font-semibold text-app-dark-text">
                          {leaving ? 'Teilnahme wird beendet...' : 'Teilnahme verlassen'}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="gap-3 rounded-3xl bg-app-dark-card/80 p-4">
                      <Text className="text-sm leading-5 text-app-dark-brand">
                        Mit einem Tap wirst du zur Aktivität hinzugefügt und kannst den Gruppenchat
                        nutzen.
                      </Text>

                      <View className="self-start flex-row items-center gap-2 rounded-full bg-app-dark-bg/70 px-3 py-2">
                        <View className="flex-row">
                          {Array.from({
                            length: Math.min(
                              Math.max(participantsCount, previewParticipants.length),
                              3,
                            ),
                          }).map((_, index) => {
                            const participant = previewParticipants[index];
                            const label = participant?.displayName?.trim() || 'Nachbar';
                            return (
                              <View
                                key={participant?.id ?? `join-fallback-${index}`}
                                className={`h-7 w-7 items-center justify-center rounded-full border border-app-dark-brand bg-app-dark-bg ${
                                  index > 0 ? '-ml-2' : ''
                                }`}
                              >
                                <Text className="text-[11px] font-semibold text-app-dark-text">
                                  {participant ? getInitials(label) : '•'}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                        <Text className="text-sm font-semibold text-app-dark-text">
                          {participantsCount} Teilnehmende
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => {
                          handleJoin().catch(() => {});
                        }}
                        disabled={joining || checkingJoinStatus}
                        className={`flex-row items-center justify-center rounded-full px-4 py-3 ${
                          joining || checkingJoinStatus ? 'bg-app-dark-bg/80' : 'bg-app-dark-accent'
                        }`}
                      >
                        <Ionicons
                          name="person-add-outline"
                          size={18}
                          color={joining || checkingJoinStatus ? '#B8C3AF' : '#203321'}
                        />
                        <Text className={'ml-2 font-semibold text-app-dark-text'}>
                          {joining || checkingJoinStatus ? 'Lädt...' : 'Teilnehmen'}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ) : null}

              {isOwner ? (
                <View className={'rounded-md bg-app-dark-bg p-4'}>
                  <Text className={'mb-3 text-base font-semibold text-app-dark-text'}>
                    Teilnehmende
                  </Text>

                  {participantsError ? (
                    <Text className="mb-2 text-sm text-red-300">{participantsError}</Text>
                  ) : null}

                  {participantsLoading ? (
                    <Text className={'text-sm text-app-dark-brand'}>
                      Teilnehmende werden geladen...
                    </Text>
                  ) : participants.length === 0 ? (
                    <Text className={'text-sm text-app-dark-brand'}>Noch keine Teilnehmenden.</Text>
                  ) : (
                    <View className="gap-3">
                      {participants.map((participant) => (
                        <View
                          key={participant.id}
                          className="flex-row items-center gap-3 rounded-md bg-app-dark-card px-3 py-3"
                        >
                          <View className="h-9 w-9 items-center justify-center rounded-full border border-app-dark-brand">
                            <Ionicons name="person-outline" size={18} color="#B8C3AF" />
                          </View>
                          <Text className="flex-1 text-sm font-medium text-app-dark-text">
                            {participant.displayName?.trim() || 'Nachbar'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}

              {isOwner ? (
                <View className={'rounded-md bg-app-dark-bg p-4'}>
                  <Text className={'mb-2 text-base font-semibold text-app-dark-text'}>Chat</Text>
                  {chatError ? (
                    <Text className={'mb-2 text-sm text-red-300'}>{chatError}</Text>
                  ) : null}
                  <Pressable
                    onPress={() => {
                      onOpenGroupChat().catch(() => {});
                    }}
                    disabled={openingChat}
                    className={`self-start flex-row items-center justify-center rounded-md px-3 py-2 ${
                      openingChat ? 'bg-app-dark-card' : 'bg-app-dark-accent'
                    }`}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color={openingChat ? '#B8C3AF' : '#203321'}
                    />
                    <Text className={'ml-2 text-sm font-semibold text-app-dark-text'}>
                      {openingChat ? 'Gruppenchat wird geöffnet...' : 'Gruppenchat öffnen'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
