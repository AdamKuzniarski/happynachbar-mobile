import { getAuthMe } from '@/lib/auth';
import { clearAuthToken, getAuthToken } from '@/lib/auth-token';

type AuthSessionDeps = {
  getAuthToken: typeof getAuthToken;
  getAuthMe: typeof getAuthMe;
  clearAuthToken: typeof clearAuthToken;
};

const defaultDeps: AuthSessionDeps = {
  getAuthToken,
  getAuthMe,
  clearAuthToken,
};

export async function hasValidStoredSession(deps: AuthSessionDeps = defaultDeps) {
  try {
    const token = await deps.getAuthToken();

    if (!token) {
      return false;
    }

    await deps.getAuthMe();
    return true;
  } catch {
    await deps.clearAuthToken().catch(() => {});
    return false;
  }
}
