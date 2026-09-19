/** "JOS NORTH" → "jos-north": the URL segment for a local government. Pure; client-safe. */
export function lgaSlug(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const STATE_WIDE = "STATE WIDE";
export const OUTSIDE_STATE = "OUTSIDE STATE";
/** Rows whose location the extractor could not read; kept in every total, never shown as a place. */
export const LOCATION_NOT_READ = "LOCATION NOT READ";

/** True for a real local government key, false for the three buckets. */
export function isPlace(lga: string): boolean {
  return lga !== STATE_WIDE && lga !== OUTSIDE_STATE && lga !== LOCATION_NOT_READ;
}
