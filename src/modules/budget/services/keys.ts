/** "JOS NORTH" → "jos-north": the URL segment for a local government. Pure; client-safe. */
export function lgaSlug(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
