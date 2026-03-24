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
};

export type ActivityDetail = Activity & {
  description?: string;
  createdById?: string;
  createdAt?: string;
  images?: ActivityImage[];
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
  imageUrls: string[];
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
