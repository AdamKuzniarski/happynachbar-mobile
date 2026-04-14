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
  return {
    ok,
    status,
    statusText,
    text: async () => body,
  };
}

describe('api.ts', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:4000';
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  test('wirft Fehler, wenn EXPO_PUBLIC_API_URL fehlt', () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(() => loadApiModule()).toThrow('Missing EXPO_PUBLIC_API_URL');
  });

  test('normalisiert API_BASE_URL und entfernt trailing slashes', () => {
    process.env.EXPO_PUBLIC_API_URL = '  http://localhost:4000///  ';

    const { API_BASE_URL } = loadApiModule();

    expect(API_BASE_URL).toBe('http://localhost:4000');
  });

  test('setzt JSON-Body, Content-Type und Authorization Header', async () => {
    mockGetAuthToken.mockResolvedValue('secret-token');
    mockFetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ ok: true }),
      }),
    );

    const { apiRequest } = loadApiModule();

    const result = await apiRequest('/activities', {
      method: 'POST',
      body: { title: 'Spaziergang' },
    });

    expect(result).toEqual({ ok: true });

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/activities', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer secret-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Spaziergang' }),
    });
  });

  test('überschreibt einen manuell gesetzten Authorization Header nicht', async () => {
    mockGetAuthToken.mockResolvedValue('secret-token');
    mockFetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        statusText: 'OK',
        body: JSON.stringify({ ok: true }),
      }),
    );

    const { apiRequest } = loadApiModule();

    await apiRequest('/activities', {
      headers: {
        Authorization: 'Bearer manual-token',
      },
    });

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/activities', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer manual-token',
      },
      body: undefined,
    });
  });

  test('wirft ApiError mit code und message aus dem API-Payload', async () => {
    mockGetAuthToken.mockResolvedValue(null);
    mockFetch.mockResolvedValue(
      createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        body: JSON.stringify({
          code: 'VALIDATION_ERROR',
          message: ['Title is required', 'PLZ is required'],
        }),
      }),
    );
  });
});
