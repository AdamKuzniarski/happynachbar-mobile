export type ApiErrorShape = {
  status: number;
  code: string;
  message: string;
};

export class ApiError extends Error implements ApiErrorShape {
  status: number;
  code: string;

  constructor({ status, code, message }: ApiErrorShape) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
};

function getApiBaseUrl() {
  const rawUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!rawUrl || rawUrl.trim().length === 0) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_URL. Set it in apps/mobile/.env (e.g. EXPO_PUBLIC_API_URL=http://localhost:4000).',
    );
  }

  const trimmedUrl = rawUrl.trim();

  try {
    const parsedUrl = new URL(trimmedUrl);
    return parsedUrl.toString().replace(/\/+$/, '');
  } catch {
    throw new Error(
      `Invalid EXPO_PUBLIC_API_URL: "${trimmedUrl}". Use a full URL like http://localhost:4000.`,
    );
  }
}

export const API_BASE_URL = getApiBaseUrl();

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

function getErrorCode(payload: unknown, status: number) {
  if (payload && typeof payload === 'object' && 'code' in payload) {
    const code = (payload as { code?: unknown }).code;

    if (typeof code === 'string' && code.trim().length > 0) {
      return code;
    }
  }

  return `HTTP_${status}`;
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError({
      status: response.status,
      code: 'INVALID_JSON',
      message: 'The API returned invalid JSON.',
    });
  }
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  const { body, headers, ...requestInit } = options;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  const hasBody = body !== undefined && body !== null;

  if (hasBody && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...requestInit,
      headers: requestHeaders,
      body: hasBody ? JSON.stringify(body) : undefined,
    });

    const payload = await parseJsonSafe(response);

    if (!response.ok) {
      throw new ApiError({
        status: response.status,
        code: getErrorCode(payload, response.status),
        message: getErrorMessage(payload, response.statusText || 'Request failed'),
      });
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Network request failed. Please check your API URL and connection.',
    });
  }
}
