import { apiFetch } from "../client";
import { buildQuery } from "@/lib/query";
import type { ListResponse } from "./types";

export type AdminUserRole = "USER" | "MODERATOR" | "ADMIN";

export type AdminUserRow = {
  id: string;
  email: string;
  role: AdminUserRole;

  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;

  lastActiveAt: string | null;
  createdAt: string;

  profile: { displayName: string | null; plz: string | null } | null;
};

type adminListUsersParams = {
  take?: number;
  cursor?: string | null;
  q?: string;
  role?: AdminUserRole;
  isBanned?: boolean;
};

export function adminListUsers({
  take,
  cursor,
  q,
  role,
  isBanned,
}: adminListUsersParams) {
  const qs = buildQuery({
    take: take ?? 20,
    cursor: cursor ?? undefined,
    q: q,
    role: role,
    isBanned: typeof isBanned === "boolean" ? String(isBanned) : undefined,
  });

  return apiFetch<ListResponse<AdminUserRow>>(`/admin/users?${qs}`);
}

export function adminSetUserRole(userId: string, role: AdminUserRole) {
  return apiFetch<{ id: string; role: AdminUserRole }>(
    `/admin/users/${encodeURIComponent(userId)}/role`,
    { method: "PATCH", body: JSON.stringify({ role }) },
  );
}

export function adminSetUserBan(
  userId: string,
  payload: { isBanned: boolean; reason?: string | null },
) {
  return apiFetch<{
    id: string;
    isBanned: boolean;
    bannedAt: string | null;
    banReason: string | null;
  }>(`/admin/users/${encodeURIComponent(userId)}/ban`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ---warnings ---

export type WarningSeverity = "LOW" | "MEDIUM" | "HIGH";

export type AdminUserWarning = {
  id: string;
  userId: string;
  message: string;
  severity: WarningSeverity;
  expiresAt: string | null;
  createdAt: string;
  createdByAdmin: { id: string; displayName: string };
};

export function adminListUserWarnings(
  userId: string,
  params: { take?: number; cursor?: string | null },
) {
  const qs = buildQuery({
    take: params.take ?? 20,
    cursor: params.cursor ?? undefined,
  });

  return apiFetch<ListResponse<AdminUserWarning>>(
    `/admin/users/${encodeURIComponent(userId)}/warnings?${qs}`,
  );
}

export function adminCreateUserWarning(
  userId: string,
  payload: { message: string; severity: WarningSeverity; expiresAt?: string },
) {
  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/warnings`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
