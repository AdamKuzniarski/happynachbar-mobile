import type { ActivityCategory } from "@/lib/api/enums";

export type ListResponse<T> = {
  items: T[];
  nextCursor: string | null;
};

export type AdminActivityStatus = "ACTIVE" | "ARCHIVED";

export type AdminCreatedBy = {
  id: string;
  email: string;
  displayName: string;
};

export type AdminActivityBase = {
  id: string;
  title: string;
  category: ActivityCategory;
  status: AdminActivityStatus;
  plz: string;
  startAt: string;
  createdAt: string;
  createdBy: AdminCreatedBy;
};

export type AdminActivityRow = AdminActivityBase & {
  updatedAt?: string;
  thumbnailUrl?: string | null;
};

export type AdminActivityDetail = AdminActivityBase & {
  description?: string;
  updatedAt: string;
};
