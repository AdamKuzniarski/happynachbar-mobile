import { apiRequest } from '@/lib/api';
import type { ActivityCategory } from '@/lib/enums';

export type ActivityImage = {
  url: string;
  sortOrder: number;
  alt?: string;
};

export type Activity = {
  id: string;
  title: string;
  category: ActivityCategory | string;
  startAt?: string;
  plz?: string;
  thumbnailUrl?: string | null;
  updatedAt?: string;
  createdBy?: { displayName?: string };
  participantsCount?: number;
  likesCount?: number;
  isLiked?: boolean;
};

export type ActivityDetail = Activity & {
  description?: string;
  createdById?: string;
  createdAt?: string;
  images?: ActivityImage[];
  isJoined?: boolean;
};

export type ActivityParticipant = {
  id: string;
  displayName: string | null;
};

export type ListActivitiesResponse = {
  items: Activity[];
  totalCount: number;
  nextCursor: string | null;
};

export type ActivityWritePayload = {
  title: string;
  description?: string;
  category: ActivityCategory;
  plz: string;
  startAt?: string;
  imageUrls?: string[];
};

type ListActivitiesParams = {
  cursor?: string | null;
  category?: ActivityCategory | null;
  q?: string;
};

export function listActivities(params: ListActivitiesParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.cursor) {
    searchParams.set('cursor', params.cursor);
  }

  if (params.category) {
    searchParams.set('category', params.category);
  }

  if (params.q) {
    searchParams.set('q', params.q);
  }

  const query = searchParams.toString();
  return apiRequest<ListActivitiesResponse>(`/activities${query ? `?${query}` : ''}`);
}

export function listFavoriteActivities(params: ListActivitiesParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.cursor) {
    searchParams.set('cursor', params.cursor);
  }

  if (params.category) {
    searchParams.set('category', params.category);
  }

  if (params.q) {
    searchParams.set('q', params.q);
  }

  const query = searchParams.toString();
  return apiRequest<ListActivitiesResponse>(`/activities/favorites${query ? `?${query}` : ''}`);
}

export function getActivity(id: string) {
  return apiRequest<ActivityDetail>(`/activities/${id}`);
}

export function createActivity(payload: ActivityWritePayload) {
  return apiRequest<ActivityDetail>(`/activities`, {
    method: 'POST',
    body: payload,
  });
}

export function updateActivity(id: string, payload: Partial<ActivityWritePayload>) {
  return apiRequest<ActivityDetail>(`/activities/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteActivity(id: string) {
  return apiRequest<{ ok: true }>(`/activities/${id}`, {
    method: 'DELETE',
  });
}

export function joinActivity(id: string) {
  return apiRequest<{ ok: true }>(`/activities/${id}/join`, {
    method: 'POST',
  });
}

export function leaveActivity(id: string) {
  return apiRequest<{ ok: true }>(`/activities/${id}/join`, {
    method: 'DELETE',
  });
}

export function getActivityJoinStatus(id: string) {
  return apiRequest<{ joined: boolean }>(`/activities/${id}/joined`);
}

export function likeActivity(id: string) {
  return apiRequest<{ ok: true }>(`/activities/${id}/like`, {
    method: 'POST',
  });
}

export function unlikeActivity(id: string) {
  return apiRequest<{ ok: true }>(`/activities/${id}/like`, {
    method: 'DELETE',
  });
}

export function getActivityLikeStatus(id: string) {
  return apiRequest<{ liked: boolean }>(`/activities/${id}/liked`);
}

export function listActivityParticipants(id: string) {
  return apiRequest<ActivityParticipant[]>(`/activities/${id}/participants`);
}
