"use server";

function getApiUrl() {
  return process.env.API_URL ?? "http://localhost:4000";
}

async function readJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(`${getApiUrl()}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const payload = await readJsonSafe(response);

    if (!response.ok) {
      const msg =
        (Array.isArray(payload?.message)
          ? payload.message.join(", ")
          : payload?.message) || "Request failed";
      return { ok: false, error: msg };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Verbindung zum Server fehlgeschlagen. Bitte erneut versuchen.",
    };
  }
}
