import { apiRequest } from '@/lib/api';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
};

export type SignupPayload = {
  email: string;
  password: string;
  displayName?: string;
};

export type SignupResponse = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export function login(payload: LoginPayload) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function signup(payload: SignupPayload) {
  return apiRequest<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: payload,
  });
}
