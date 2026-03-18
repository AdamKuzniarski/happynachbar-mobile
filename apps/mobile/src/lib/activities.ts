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

type ListActivitiesParams = {
  cursor?: string | null;
  category?: ActivityCategory | null;
};

export function listActivities(params: ListActivitiesParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.cursor) {
    searchParams.set('cursor', params.cursor);
  }

  if (params.category) {
    searchParams.set('category', params.category);
  }

  const query = searchParams.toString();
  return apiRequest<ListActivitiesResponse>(`/activities${query ? `?${query}` : ''}`);
}

export function getActivity(id: string) {
  return apiRequest<ActivityDetail>(`/activities/${id}`);
}
