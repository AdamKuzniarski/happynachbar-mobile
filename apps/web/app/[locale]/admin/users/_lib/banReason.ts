const PREFIX = "TEMP_BAN_UNTIL=";

export function buildBanReason(
  inputReason: string,
  durationDays: number | "PERM",
) {
  const reason = inputReason.trim();

  if (durationDays === "PERM") return reason || undefined;

  const until = new Date(
    Date.now() + durationDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  if (!reason) return `${PREFIX}${until}`;
  return `${PREFIX}${until} | ${reason}`;
}

export function buildBanReasonWithUntil(
  inputReason: string,
  until: Date | null,
) {
  const reason = inputReason.trim();

  if (!until) return reason || undefined;

  const untilIso = until.toISOString();
  if (!reason) return `${PREFIX}${untilIso}`;
  return `${PREFIX}${untilIso} | ${reason}`;
}

export function parseBanUntil(banReason: string | null) {
  if (!banReason) return null;
  const m = banReason.match(
    /TEMP_BAN_UNTIL=([0-9]{4}-[0-9]{2}-[0-9]{2}T[^ ]+)/,
  );
  if (!m?.[1]) return null;
  const d = new Date(m[1]);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function stripBanMeta(banReason: string | null) {
  if (!banReason) return "";
  return banReason.replace(/TEMP_BAN_UNTIL=[^|]+(\|\s*)?/, "").trim();
}
