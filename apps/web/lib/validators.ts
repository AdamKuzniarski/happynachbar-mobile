export type { AddUrlResult, ManualUrlAddStatus } from "./api/types";
import type { AddUrlResult, ManualUrlAddStatus } from "./api/types";

export function normalizePostalCode(v: string) {
  return v.replace(/\s+/g, "").trim();
}

export function normalizePostalCodeInput(v: string) {
  return v.replace(/\D+/g, "").slice(0, 5);
}

export function isValidPostalCode(v: string) {
  const x = normalizePostalCode(v);
  return /^\d{5}$/.test(x);
}

export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
export function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

export function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function tryAddManualUrl(
  value: string,
  existing: string[],
  maxTotalImages: number,
  currentFilesCount: number,
): AddUrlResult {
  const normalized = value.trim();
  if (!normalized) return { ok: true, value: "" };
  if (!isHttpUrl(normalized)) {
    return { ok: false, reason: "invalid" };
  }
  if (currentFilesCount + existing.length >= maxTotalImages) {
    return { ok: false, reason: "limit" };
  }
  if (existing.includes(normalized)) {
    return { ok: false, reason: "duplicate" };
  }
  return { ok: true, value: normalized };
}

export const MANUAL_URL_STATUS_MESSAGES: Record<ManualUrlAddStatus, string> = {
  empty: "",
  invalid: "Bitte eine gültige http(s) URL eingeben.",
  limit: "Maximal 5 Bilder insgesamt erlaubt.",
  duplicate: "Wurde nicht hinzugefügt, es handelt sich um ein Duplikat.",
  added: "URL hinzugefügt.",
};

export function getManualUrlAddResult(
  value: string,
  existing: string[],
  maxTotalImages: number,
  currentFilesCount: number,
): { status: ManualUrlAddStatus; value?: string } {
  const res = tryAddManualUrl(
    value,
    existing,
    maxTotalImages,
    currentFilesCount,
  );
  if (!value.trim()) return { status: "empty" };
  if (!res.ok) return { status: res.reason };
  if (!res.value) return { status: "empty" };
  return { status: "added", value: res.value };
}
