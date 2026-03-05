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

export async function registerUser(
  email: string,
  password: string,
  displayName?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const dn = displayName?.trim();

  const response = await fetch(`${getApiUrl()}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      dn ? { email, password, displayName: dn } : { email, password }
    ),
  });

  const payload = await readJsonSafe(response);

  if (!response.ok) {
    const msg =
      (Array.isArray(payload?.message)
        ? payload.message.join(", ")
        : payload?.message) || "Signup failed";
    return { ok: false, error: msg };
  }

  return { ok: true };
}
