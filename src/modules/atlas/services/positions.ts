import type { Position } from "../types";

/**
 * Static, approximate geographic placement for the cluster views, lifted
 * from the approved design: Sokoto upper left, Lagos lower left, Borno upper
 * right. Sizes step through a fixed decorative rotation (56 / 64 / 72) and
 * carry no data. Drift paths, durations and negative delays are per circle
 * so nothing moves in phase.
 */
type Row = [x: number, y: number, size: 56 | 64 | 72, path: 1 | 2 | 3 | 4 | 5 | 6, duration: number, delay: number];

const STATES: Record<string, Row> = {
  sokoto: [13, 7, 64, 1, 24, 6],
  zamfara: [24, 10, 56, 3, 29, 14],
  katsina: [35, 4, 72, 5, 26, 3],
  jigawa: [46, 9, 56, 2, 31, 19],
  yobe: [58, 6, 64, 4, 21, 9],
  borno: [70, 11, 72, 6, 27, 22],
  kebbi: [7, 22, 56, 2, 25, 11],
  kano: [37, 21, 64, 1, 30, 17],
  bauchi: [53, 17, 56, 3, 22, 5],
  gombe: [62, 21, 64, 5, 28, 13],
  adamawa: [74, 27, 72, 4, 33, 25],
  niger: [20, 33, 72, 1, 34, 0],
  kaduna: [34, 34, 64, 6, 26, 8],
  plateau: [45, 40, 56, 2, 23, 15],
  taraba: [66, 40, 72, 5, 30, 21],
  kwara: [10, 46, 64, 3, 27, 4],
  fct: [30, 45, 56, 4, 24, 18],
  nasarawa: [40, 48, 56, 1, 32, 12],
  benue: [50, 52, 64, 6, 25, 2],
  "cross-river": [64, 56, 56, 2, 29, 23],
  kogi: [25, 56, 72, 5, 22, 10],
  oyo: [9, 60, 56, 3, 31, 7],
  osun: [17, 66, 64, 1, 26, 16],
  enugu: [45, 64, 56, 4, 28, 20],
  ebonyi: [55, 62, 56, 6, 23, 1],
  imo: [69, 64, 56, 6, 30, 17],
  ekiti: [24, 70, 56, 2, 33, 26],
  edo: [33, 72, 64, 5, 24, 6],
  anambra: [42, 75, 56, 3, 30, 13],
  abia: [52, 77, 56, 1, 27, 3],
  "akwa-ibom": [61, 73, 64, 4, 31, 24],
  ogun: [14, 78, 56, 6, 22, 9],
  lagos: [5, 85, 64, 2, 28, 18],
  ondo: [22, 86, 56, 5, 25, 11],
  delta: [32, 88, 56, 3, 32, 5],
  bayelsa: [43, 90, 56, 1, 29, 21],
  rivers: [53, 89, 64, 4, 26, 14],
};

const NIGER_LGAS: Record<string, Row> = {
  AGAIE: [10, 6, 64, 1, 26, 5],
  AGWARA: [27, 4, 56, 3, 30, 13],
  BORGU: [44, 8, 72, 5, 24, 3],
  BOSSO: [61, 5, 56, 2, 31, 18],
  CHANCHAGA: [79, 9, 64, 4, 22, 8],
  EDATI: [6, 24, 56, 6, 28, 21],
  GBAKO: [23, 27, 64, 1, 33, 9],
  GURARA: [40, 23, 56, 3, 25, 16],
  KATCHA: [57, 26, 72, 5, 29, 6],
  KONTAGORA: [75, 22, 64, 2, 23, 11],
  BIDA: [88, 30, 72, 1, 34, 0],
  LAPAI: [12, 45, 56, 4, 31, 24],
  LAVUN: [30, 48, 72, 6, 27, 2],
  MAGAMA: [48, 44, 56, 1, 24, 14],
  MARIGA: [65, 47, 64, 3, 32, 19],
  MASHEGU: [79, 45, 56, 5, 26, 7],
  MOKOWA: [8, 64, 64, 2, 30, 12],
  MUNYA: [22, 68, 56, 4, 22, 4],
  PAIKORO: [43, 63, 72, 6, 28, 22],
  RAFI: [60, 66, 56, 1, 31, 10],
  RIJAU: [77, 62, 64, 3, 25, 17],
  SHIRORO: [14, 84, 56, 5, 29, 1],
  SULEJA: [32, 87, 64, 2, 24, 20],
  TAFA: [50, 83, 56, 4, 33, 15],
  WUSHISHI: [68, 86, 72, 6, 27, 6],
};

function toPosition([x, y, size, path, duration, delay]: Row): Position {
  // Design timings run 22–34s; halved so the drift is visible at a glance.
  return { x, y, size, drift: { path, duration: Math.round(duration * 0.5), delay } };
}

/**
 * States without a hand-placed table get a staggered grid: alphabetical,
 * left to right, rows offset so it reads as a cluster rather than a table.
 * Still decorative, still carries no data.
 */
function gridPosition(index: number, count: number): Position {
  const cols = Math.max(4, Math.ceil(Math.sqrt(count * 1.6)));
  const rows = Math.ceil(count / cols);
  const r = Math.floor(index / cols);
  const c = index % cols;
  const x = 8 + ((c + (r % 2 ? 0.5 : 0)) * 84) / Math.max(1, cols - 0.5);
  const y = 8 + (rows > 1 ? (r * 78) / (rows - 1) : 40);
  const sizes: (56 | 64 | 72)[] = [56, 64, 72];
  return {
    x: Math.round(x),
    y: Math.round(y),
    size: sizes[index % 3],
    drift: { path: ((index % 6) + 1) as Drift["path"], duration: 22 + (index % 12), delay: (index * 7) % 26 },
  };
}
type Drift = Position["drift"];

/** The design's state layout spans x = 5–74%; stretch it to use the whole field. */
function stretchX(p: Position): Position {
  return { ...p, x: Math.round(4 + ((p.x - 5) * 90) / 69) };
}

export function statePosition(slug: string): Position {
  const row = STATES[slug];
  return row ? stretchX(toPosition(row)) : gridPosition(Object.keys(STATES).length, Object.keys(STATES).length + 1);
}

/** Niger's local governments are placed by hand; other states use the grid. */
export function lgaPosition(state: string, key: string, index = 0, count = 1): Position {
  const row = state === "niger" ? NIGER_LGAS[key] : undefined;
  return row ? toPosition(row) : gridPosition(index, count);
}
