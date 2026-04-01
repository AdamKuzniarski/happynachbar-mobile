import { hasValidStoredSession } from '@/lib/auth-session';

jest.mock('@/lib/auth', () => ({
  getAuthMe: jest.fn(),
}));

jest.mock('@/lib/auth-token', () => ({
  getAuthToken: jest.fn(),
  clearAuthToken: jest.fn(),
}));

describe('hasValidStoredSession', () => {
  it('returns false when no token is stored', async () => {
    const result = await hasValidStoredSession({
      getAuthToken: jest.fn().mockResolvedValue(null),
      getAuthMe: jest.fn(),
      clearAuthToken: jest.fn(),
    });

    expect(result).toBe(false);
  });

  it('returns true when token exists and session check succeeds', async () => {
    const getAuthMe = jest.fn().mockResolvedValue({ userId: 'u1', email: 'test@example.com' });

    const result = await hasValidStoredSession({
      getAuthToken: jest.fn().mockResolvedValue('token'),
      getAuthMe,
      clearAuthToken: jest.fn(),
    });

    expect(result).toBe(true);
    expect(getAuthMe).toHaveBeenCalledTimes(1);
  });

  it('clears stale token and returns false when session check fails', async () => {
    const clearAuthToken = jest.fn().mockResolvedValue(undefined);

    const result = await hasValidStoredSession({
      getAuthToken: jest.fn().mockResolvedValue('stale-token'),
      getAuthMe: jest.fn().mockRejectedValue(new Error('Unauthorized')),
      clearAuthToken,
    });

    expect(result).toBe(false);
    expect(clearAuthToken).toHaveBeenCalledTimes(1);
  });
});
