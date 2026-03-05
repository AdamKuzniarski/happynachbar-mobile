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

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(`${getApiUrl()}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
    cache: "no-store",
  });

  const payload = await readJsonSafe(response);

  if (!response.ok) {
    const msg =
      (Array.isArray(payload?.message)
        ? payload.message.join(", ")
        : payload?.message) || "Reset failed";
    return { ok: false, error: msg };
  }

  return { ok: true };
}
