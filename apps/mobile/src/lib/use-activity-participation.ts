import { useEffect, useState } from 'react';

import {
  getActivityJoinStatus,
  joinActivity,
  leaveActivity,
  listActivityParticipants,
  type ActivityDetail,
  type ActivityParticipant,
} from '@/lib/activities';

type Props = {
  activityId: string | null;
  activity: ActivityDetail | null;
  viewerUserId: string | null;
  isOwner: boolean;
};

export function useActivityParticipation({
  activityId,
  activity,
  viewerUserId,
  isOwner,
}: Props) {
  const [joined, setJoined] = useState(false);
  const [checkingJoinStatus, setCheckingJoinStatus] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

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

  async function handleJoin() {
    if (!activityId || joining || leaving || checkingJoinStatus) return null;

    if (!viewerUserId) {
      setJoinError('Bitte logge dich ein, um teilzunehmen.');
      return null;
    }

    setJoinError(null);
    setJoining(true);

    try {
      await joinActivity(activityId);
      setJoined(true);
      return { isJoined: true, participantsCountDelta: 1 };
    } catch (nextError) {
      setJoinError(
        nextError instanceof Error
          ? nextError.message
          : 'Teilnahme konnte nicht gespeichert werden.',
      );
      return null;
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (!activityId || leaving || joining || checkingJoinStatus) return null;

    setJoinError(null);
    setLeaving(true);

    try {
      await leaveActivity(activityId);
      setJoined(false);
      return { isJoined: false, participantsCountDelta: -1 };
    } catch (nextError) {
      setJoinError(
        nextError instanceof Error ? nextError.message : 'Teilnahme konnte nicht entfernt werden.',
      );
      return null;
    } finally {
      setLeaving(false);
    }
  }

  function syncFromActivity(nextActivity: ActivityDetail) {
    setJoinError(null);
    setParticipants([]);
    setParticipantsError(null);
    setJoined(!!nextActivity.isJoined);
  }

  function applyParticipantCountDelta(delta: number, currentCount?: number) {
    if (delta > 0) return (currentCount ?? 0) + 1;
    return Math.max((currentCount ?? 1) - 1, 0);
  }

  return {
    joined,
    checkingJoinStatus,
    joining,
    leaving,
    joinError,
    participants,
    participantsLoading,
    participantsError,
    setJoinError,
    setParticipants,
    setParticipantsError,
    syncFromActivity,
    applyParticipantCountDelta,
    handleJoin,
    handleLeave,
  };
}
