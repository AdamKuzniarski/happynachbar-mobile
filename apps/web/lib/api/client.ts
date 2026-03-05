const API_BASE_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";
type ApiFetchInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {},
): Promise<T | undefined> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const raw = res.status === 204 ? "" : await res.text();
  let data: unknown;
  if (isJson && raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      // fall back to raw text
    }
  }

  if (!res.ok) {
    const messageFromJson = (() => {
      if (typeof data !== "object" || data === null) return null;
      if (!("message" in data)) return null;
      const message = (data as Record<string, unknown>).message;

      if (typeof message === "string") return message;
      if (
        Array.isArray(message) &&
        message.every((m) => typeof m === "string")
      ) {
        return message.join(", ");
      }
      return null;
    })();
    const msg = messageFromJson || raw || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (!raw) return undefined as unknown as T;
  if (data !== undefined) return data as T;
  return raw as unknown as T;
}
