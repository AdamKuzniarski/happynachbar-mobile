import { apiRequest } from '@/lib/api';
import type { ActivityCategory } from '@/lib/enums';

export type ActivitiyUserSummary = {
  id?: string;
  displayName?: string;
};

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
};

export function listActivities(params: ListActivitiesParams = {}) {
  const query = params.cursor ? `?cursor=${encodeURIComponent(params.cursor)}` : '';

  return apiRequest<ListActivitiesResponse>(`/activities${query}`);
}

export function getActivitiy(id: string) {
  return apiRequest<Activity>(`/activities/${id}`);
}
