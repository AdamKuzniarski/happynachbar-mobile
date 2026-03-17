import { apiRequest } from '@/lib/api';
import type { ActivityCategory } from '@/lib/enums';

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

export type ListActivitiesResponse = {
  items: Activity[];
  totalCount: number;
  nextCursor: string | null;
};

export function listActivities() {
  return apiRequest<ListActivitiesResponse>('/activities');
}
