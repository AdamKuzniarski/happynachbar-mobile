import { apiRequest } from '@/lib/api';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
};

export type AuthMeResponse = {
  userId: string;
  email: string;
  role?: string;
};

export function login(payload: LoginPayload) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function getAuthMe() {
  return apiRequest<AuthMeResponse>('/auth/me');
}
