import { ApiError } from '../lib/api';

export type ProfileFormValues = {
  displayName: string;
  plz: string;
  bio: string;
};

export type ProfileFormErrors = {
  displayName: string | null;
  plz: string | null;
  bio: string | null;
};

export function getInitials(name?: string | null) {
  if (!name) return 'N';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'N';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'N';
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function validateProfileForm(values: ProfileFormValues) {
  const normalized = {
    displayName: values.displayName.trim(),
    plz: values.plz.trim(),
    bio: values.bio.trim(),
  };

  const errors: ProfileFormErrors = {
    displayName: null,
    plz: null,
    bio: null,
  };

  return { isValid: true, errors, normalized };
}
