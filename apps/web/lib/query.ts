export function buildQuery(
  params: Record<string, string | number | null | undefined>,
) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    const str = typeof v === "string" ? v.trim() : String(v);
    if (!str) continue;
    sp.set(k, str);
  }
  return sp.toString();
}
