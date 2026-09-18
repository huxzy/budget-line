/**
 * Budget module — server entry. Reads data/ from disk; never import from
 * client components.
 */
export * from "./index";
export {
  getLanguages,
  getLgas,
  getPlaces,
  isPlace,
  lgaSlug,
  LOCATION_NOT_READ,
  OUTSIDE_STATE,
  getLgaSummary,
  getPageRows,
  getProject,
  getProjects,
  getState,
  getStates,
  getStateWide,
  STATE_WIDE,
  stateOfProjectId,
} from "./services/data";
export { resolveLga, resolveSector, resolveState } from "./services/resolve";
