/**
 * Pure, server/client-safe year helpers. Kept separate from year.ts because
 * that file also imports repository.ts (googleapis, Node-only) — pulling
 * these into a client component through year.ts drags that whole chain into
 * the browser bundle and breaks the build.
 */
export function currentYear(): number {
  return new Date().getFullYear();
}

export function yearOf(isoDate: string, fallback = currentYear()): number {
  const parsed = Number.parseInt(isoDate.slice(0, 4), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Parses the ?year= search param, falling back to the current festival year. */
export function resolveYear(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : currentYear();
}
