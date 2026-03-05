import { apiFetch } from "./client";
import { buildQuery } from "@/lib/query";
import type { ActivityDetail, ListActivitiesResponse } from "./types";

type PresignResponse = {
  uploadUrl: string;
  uploadFiles: Record<string, string>;
  assetUrl?: string;
};

export type ListActivitiesParams = {
  take?: number;
  cursor?: string | null;
  q?: string;
  plz?: string;
  category?: string;
  status?: string;
  createdById?: string;
  startFrom?: string;
  startTo?: string;
};

export function listActivities(params: ListActivitiesParams) {
  const qs = buildQuery({
    take: params.take ?? 10,
    cursor: params.cursor ?? null,
    q: params.q,
    plz: params.plz,
    category: params.category,
    status: params.status,
    createdById: params.createdById,
    startFrom: params.startFrom,
    startTo: params.startTo,
  });

  return apiFetch<ListActivitiesResponse>(`/activities?${qs}`);
}

export function getActivity(id: string) {
  return apiFetch<ActivityDetail>(`/activities/${encodeURIComponent(id)}`);
}

export type CreateActivityPayload = {
  title: string;
  description?: string;
  category: string;
  plz: string;
  startAt?: string;
  imageUrls?: string[];
};

export async function createActivity(
  payload: CreateActivityPayload,
): Promise<
  { ok: true } | { ok: false; status: number; message?: string | string[] }
> {
  try {
    await apiFetch(`/activities`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ok: true };
  } catch (e: unknown) {
    // apiFetch wirft Error(message)
    return {
      ok: false,
      status: 400,
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function updateActivity(
  id: string,
  payload: Partial<CreateActivityPayload>,
): Promise<
  { ok: true } | { ok: false; status: number; message?: string | string[] }
> {
  try {
    await apiFetch(`/activities/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      status: 400,
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function deleteActivity(
  id: string,
): Promise<
  { ok: true } | { ok: false; status: number; message?: string | string[] }
> {
  try {
    await apiFetch(`/activities/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      status: 400,
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function joinActivity(
  id: string,
): Promise<
  { ok: true } | { ok: false; status: number; message?: string | string[] }
> {
  try {
    await apiFetch(`/activities/${encodeURIComponent(id)}/join`, {
      method: "POST",
    });
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      status: 400,
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function leaveActivity(
  id: string,
): Promise<
  { ok: true } | { ok: false; status: number; message?: string | string[] }
> {
  try {
    await apiFetch(`/activities/${encodeURIComponent(id)}/join`, {
      method: "DELETE",
    });
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      status: 400,
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function getActivityJoinStatus(
  id: string,
): Promise<
  | { ok: true; joined: boolean }
  | { ok: false; status: number; message?: string | string[] }
> {
  try {
    const res = await apiFetch<{ joined: boolean }>(
      `/activities/${encodeURIComponent(id)}/joined`,
    );
    return { ok: true, joined: !!res?.joined };
  } catch (e: unknown) {
    return {
      ok: false,
      status: 400,
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export type ActivityParticipant = {
  id: string;
  displayName: string | null;
};

export async function listActivityParticipants(
  id: string,
): Promise<
  | { ok: true; participants: ActivityParticipant[] }
  | { ok: false; status: number; message?: string | string[] }
> {
  try {
    const res = await apiFetch<ActivityParticipant[]>(
      `/activities/${encodeURIComponent(id)}/participants`,
    );
    return { ok: true, participants: res ?? [] };
  } catch (e: unknown) {
    return {
      ok: false,
      status: 400,
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function uploadActivityImages(files: File[]) {
  if (!files.length) return [];

  const urls: string[] = [];
  for (const file of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Nur JPG, PNG oder WebP Bilder sind erlaubt.");
    }
    if (file.size > 10_000_000) {
      throw new Error("Bild ist zu groß (max. 10MB).");
    }

    const presign = await apiFetch<PresignResponse>("/uploads/presign", {
      method: "POST",
      body: JSON.stringify({
        kind: "activity",
        contentType: file.type,
      }),
    });

    if (!presign?.uploadUrl || !presign?.uploadFiles) {
      throw new Error("Upload vorbereiten fehlgeschlagen.");
    }

    const fd = new FormData();
    for (const [k, v] of Object.entries(presign.uploadFiles)) {
      fd.append(k, String(v));
    }
    fd.append("file", file);

    const uploadRes = await fetch(presign.uploadUrl, {
      method: "POST",
      body: fd,
    });
    if (!uploadRes.ok) {
      throw new Error("Bild-Upload fehlgeschlagen.");
    }

    if (presign.assetUrl) urls.push(String(presign.assetUrl));
  }

  return urls;
}
