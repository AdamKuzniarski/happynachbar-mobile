import { getAuthToken } from '@/lib/auth-token';
import { apiRequest } from '@/lib/api';

export type MeProfile = {
  displayName?: string | null;
  plz?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
};

export type MeResponse = {
  id: string;
  email: string;
  createdAt?: string;
  profile: MeProfile | null;
  profileCompletion?: {
    isComplete: boolean;
    percent: number;
    missing: string[];
  };
};

export type UpdateMePayload = {
  displayName: string;
  plz: string;
  avatarUrl?: string;
  bio?: string;
};

async function getAuthHeaders() {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function getMe() {
  return apiRequest<MeResponse>('/users/me', {
    headers: await getAuthHeaders(),
  });
}

export async function updateMe(payload: UpdateMePayload) {
  return apiRequest<{ ok: boolean }>('/users/me', {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: payload,
  });
}
