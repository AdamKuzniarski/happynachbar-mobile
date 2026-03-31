import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityForm } from '@/components/activities/ActivityForm';
import { ActivityHero } from '@/components/activities/ActivityHero';
import { ActivityMetaSection } from '@/components/activities/ActivityMetaSection';
import { ActivityOwnerActions } from '@/components/activities/ActivityOwnerActions';
import { SectionCard } from '@/components/ui/SectionCard';
import { openGroupConversation } from '@/lib/chat';
import { formatDate } from '@/lib/format';
import {
  getActivityLikeStatus,
  likeActivity,
  unlikeActivity,
  type ActivityWritePayload,
} from '@/lib/activities';
import { useActivityParticipation } from '@/lib/use-activity-participation';
import { useActivityDetailScreen } from '@/lib/use-activity-detail-screen';
import { FavoriteButton } from '@/components/activities/FavoriteButton';

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

  const [openingChat, setOpeningChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { width } = useWindowDimensions();

  const {
    activity,
    setActivity,
    viewerUserId,
    loading,
    isEditing,
    isSaving,
    error,
    notFound,
    isOwner,
    setReloadKey,
    setIsEditing,
    handleUpdate,
    handleArchive,
  } = useActivityDetailScreen({
    activityId,
    onActivityLoaded: (data) => {
      setChatError(null);
      syncFromActivity(data);
    },
  });
  const {
    joined,
    checkingJoinStatus,
    joining,
    leaving,
    joinError,
    participants,
    participantsLoading,
    participantsError,
    syncFromActivity,
    applyParticipantCountDelta,
    handleJoin,
    handleLeave,
  } = useActivityParticipation({
    activityId,
    activity,
    viewerUserId,
    isOwner,
  });

  const imageUrls = activity?.images?.map((image) => image.url).filter(Boolean) ?? [];
  const galleryImages =
    imageUrls.length > 0 ? imageUrls : activity?.thumbnailUrl ? [activity.thumbnailUrl] : [];
  const galleryImageWidth = Math.max(width - 32, 280);
  const creatorName = activity?.createdBy?.displayName?.trim() || 'Nachbar';

  function handleGalleryScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!galleryImages.length) return;

    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / galleryImageWidth);
    const clampedIndex = Math.max(0, Math.min(nextIndex, galleryImages.length - 1));
    setCurrentImageIndex(clampedIndex);
  }

  async function handleToggleFavorite() {
    if (!activityId || favoriteLoading) return;

    const wasLiked = liked;

    setFavoriteLoading(true);
    setLiked(!wasLiked);

    try {
      if (wasLiked) {
        await unlikeActivity(activityId);
      } else {
        await likeActivity(activityId);
      }

      setActivity((current) =>
        current
          ? {
              ...current,
              likesCount: Math.max((current.likesCount ?? 0) + (wasLiked ? -1 : 1), 0),
              isLiked: !wasLiked,
            }
          : current,
      );
    } catch {
      setLiked(wasLiked);
    } finally {
      setFavoriteLoading(false);
    }
  }

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activity?.id, galleryImages.length]);

  useEffect(() => {
    if (!activityId) {
      setLiked(false);
      return;
    }

    let active = true;

    getActivityLikeStatus(activityId)
      .then((result) => {
        if (!active) return;
        setLiked(!!result.liked);
      })
      .catch(() => {
        if (!active) return;
        setLiked(false);
      });

    return () => {
      active = false;
    };
  }, [activityId]);

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

  const canAccessGroupChat = isOwner || joined;
  const participantsCount = activity.participantsCount ?? 0;
  const previewParticipants = participants.slice(0, 3);

  return (
    <SafeAreaView className={'flex-1 bg-app-dark-bg'}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View className={'gap-4'}>
          <View className={'flex-row items-center justify-between'}>
            <Pressable
              onPress={() => router.back()}
              className={'self-start flex-row rounded-md px-3 py-2'}
            >
              <View className={'flex-row items-center gap-2'}>
                <Ionicons name="arrow-back-outline" size={16} color="#F3F6EE" />
                <Text className={'text-sm font-semibold text-app-dark-text'}>Zurück</Text>
              </View>
            </Pressable>

            <FavoriteButton
              liked={liked}
              disabled={favoriteLoading}
              onPress={() => {
                handleToggleFavorite().catch(() => {});
              }}
            />
          </View>

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
            </>
          ) : null}

          {isOwner && isEditing ? (
            <View className="rounded-md bg-app-dark-bg p-4">
              <Text className="mb-4 text-center text-lg font-bold text-app-dark-text">
                Aktivität bearbeiten
              </Text>
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

          {!isEditing ? (
            <>
              <ActivityMetaSection
                startAt={activity.startAt}
                plz={activity.plz}
                creatorName={creatorName}
                updatedAt={activity.updatedAt}
                formatDate={formatDate}
              />

              <SectionCard>
                <Text className={'mb-2 text-base font-semibold text-app-dark-text'}>
                  Beschreibung
                </Text>

                <Text className={'leading-6 text-app-dark-brand'}>
                  {activity.description?.trim() || 'Keine Beschreibung vorhanden.'}
                </Text>
              </SectionCard>

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
                          handleLeave().then((result) => {
                            if (!result) return;
                            setActivity((current) =>
                              current
                                ? {
                                    ...current,
                                    isJoined: result.isJoined,
                                    participantsCount: applyParticipantCountDelta(
                                      result.participantsCountDelta,
                                      current.participantsCount,
                                    ),
                                  }
                                : current,
                            );
                            setChatError(null);
                          });
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
                          handleJoin().then((result) => {
                            if (!result) return;
                            setActivity((current) =>
                              current
                                ? {
                                    ...current,
                                    isJoined: result.isJoined,
                                    participantsCount: applyParticipantCountDelta(
                                      result.participantsCountDelta,
                                      current.participantsCount,
                                    ),
                                  }
                                : current,
                            );
                          });
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

              {isOwner ? (
                <View className="items-end">
                  <ActivityOwnerActions
                    onArchive={handleArchive}
                    onEdit={() => setIsEditing((prev) => !prev)}
                  />
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
