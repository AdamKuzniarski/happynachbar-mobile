import { apiFetch } from "@/lib/api/client";
import { buildQuery } from "@/lib/query";
import type {
  AdminActivityDetail,
  AdminActivityRow,
  AdminActivityStatus,
  ListResponse,
} from "./types";
import type { ActivityCategory } from "../enums";

type adminListActivitiesParams = {
  take?: number;
  cursor?: string | null;
  q?: string;
  status?: AdminActivityStatus;
  plz?: string;
  category?: ActivityCategory;
  createdById?: string;
};

export function adminListActivities({
  take,
  cursor,
  q,
  status,
  plz,
  category,
  createdById,
}: adminListActivitiesParams) {
  const qs = buildQuery({
    take: take ?? 20,
    cursor: cursor ?? undefined,
    q: q,
    status: status,
    plz: plz,
    category: category,
    createdById: createdById,
  });
  return apiFetch<ListResponse<AdminActivityRow>>(`/admin/activities?${qs}`);
}

export function adminGetActivity(id: string) {
  return apiFetch<AdminActivityDetail>(
    `/admin/activities/${encodeURIComponent(id)}`,
  );
}

export function adminUpdateActivity(
  id: string,
  payload: {
    title?: string;
    description?: string;
    category?: ActivityCategory;
    plz?: string;
    scheduledAt?: string;
  },
) {
  return apiFetch(`/admin/activities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function adminSetActivityStatus(
  id: string,
  status: AdminActivityStatus,
) {
  return apiFetch<{ id: string; status: string }>(
    `/admin/activities/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}
