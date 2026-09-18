/**
 * Budget module — client-safe entry.
 * Types and pure formatting only. Data access lives in "./server".
 */
export * from "./types";
export { formatCompact, formatDisplay, formatNaira, formatPlain, formatSpoken, toKobo } from "./services/format";
