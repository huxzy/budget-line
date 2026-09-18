/**
 * Budget module — server entry. Reads data/ from disk; never import from
 * client components.
 */
export * from "./index";
export {
  getLanguages,
  getLgas,
  getLgaSummary,
  getProject,
  getProjects,
  getState,
  getStates,
  getStateWide,
  STATE_WIDE,
} from "./services/data";
export { resolveLga, resolveSector, resolveState } from "./services/resolve";
