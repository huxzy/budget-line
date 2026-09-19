/**
 * Budget module — client-safe entry.
 * Types and pure formatting only. Data access lives in "./server".
 */
export * from "./types";
export { formatCompact, formatDisplay, formatNaira, formatPlain, formatSpoken, toKobo } from "./services/format";
export { SECTOR_ORDER, sectorLabel } from "./services/sectors";
export { documentName, REGISTRY, stateName } from "./services/registry";
export { lgaSlug } from "./services/keys";
export { isPlace, LOCATION_NOT_READ, OUTSIDE_STATE, STATE_WIDE } from "./services/keys";
