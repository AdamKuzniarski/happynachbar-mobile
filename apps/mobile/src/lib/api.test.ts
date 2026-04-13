const mockGetAuthToken = jest.fn();
const mockFetch = jest.fn();

jest.mock('@/lib/auth-token', () => ({
  getAuthToken: (...args: unknown[]) => mockGetAuthToken(...args),
}));

function loadApiModule() {
  return require('@/lib/api') as typeof import('@/lib/api');
}

function createMockResponse({
  ok,
  status,
  statusText,
  body,
}: {
  ok: boolean;
  status: number;
  statusText: string;
  body: string;
}) {
  return { ok: ok, status: status, statusText: statusText, body: body };
}

describe('api.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();

    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:4000';
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  test('wirft Fehler, wenn EXPO_PUBLIC_API_URL fehlt', () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(() => loadApiModule()).toThrow('Missing EXPO_PUBLIC_API_URL');
  });
});
