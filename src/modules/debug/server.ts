/** The troubleshooting page and its route exist only in development or when VOICE_DEBUG=1 is set. */
export function debugEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VOICE_DEBUG === "1";
}
