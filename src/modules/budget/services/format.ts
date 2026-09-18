/**
 * Naira formatting. Three renderings of one figure:
 *
 *   display  "₦75,000,000"             exact, tabular, for the headline
 *   plain    "75 million naira"        short reading for the quiet line under it
 *   spoken   "seventy-five million naira"  read verbatim by TTS
 *
 * These are generated once at build time (scripts/build-data.ts) and stored on
 * every project row. Nothing at request time, and never the model, formats a
 * figure.
 */
import { toWords } from "number-to-words";
import type { Lang } from "../types";

const SCALES = [
  { value: 1_000_000_000, en: "billion", ha: "biliyan" },
  { value: 1_000_000, en: "million", ha: "miliyan" },
  { value: 1_000, en: "thousand", ha: "dubu" },
] as const;

const wholeNaira = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
const nairaAndKobo = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Round to kobo, absorbing floating-point noise from summed amounts. */
export function toKobo(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** "₦75,000,000". Kobo are shown (always two digits) only when the figure has them. */
export function formatDisplay(amount: number): string {
  const n = toKobo(amount);
  return `₦${(Number.isInteger(n) ? wholeNaira : nairaAndKobo).format(n)}`;
}

/**
 * "75 million naira" / "about 1.25 billion naira".
 * Round figures read cleanly; anything else is rounded to two decimals of the
 * scale and prefixed with "about" so the reading never pretends to be exact.
 * Hausa follows the BBC Hausa convention: "naira miliyan 75", with scale words
 * from a fixed lookup (dubu / miliyan / biliyan). No full Hausa number grammar.
 */
export function formatPlain(amount: number, lang: Lang = "en"): string {
  const naira = Math.round(amount);
  if (naira === 0) return lang === "ha" ? "naira sifili" : "zero naira";

  const scale = SCALES.find((s) => naira >= s.value);
  if (!scale) return lang === "ha" ? `naira ${naira}` : `${naira} naira`;

  const scaled = naira / scale.value;
  const rounded = Math.round(scaled * 100) / 100;
  const exact = Number.isInteger(scaled);
  const num = rounded.toString();

  if (lang === "ha") {
    const core = `naira ${scale.ha} ${num}`;
    return exact ? core : `kusan ${core}`;
  }
  const core = `${num} ${scale.en} naira`;
  return exact ? core : `about ${core}`;
}

/**
 * "seventy-five million naira". Whole naira, fully written out so TTS reads the
 * exact figure. Hausa reuses the plain form — the assistant reads digits, and
 * we deliberately do not attempt Hausa number words.
 */
export function formatSpoken(amount: number, lang: Lang = "en"): string {
  const naira = Math.round(amount);
  if (lang === "ha") return formatPlain(naira, "ha");
  if (naira === 0) return "zero naira";
  return `${toWords(naira)} naira`;
}

export function formatNaira(amount: number, lang: Lang = "en") {
  return {
    display: formatDisplay(amount),
    plain: formatPlain(amount, lang),
    spoken: formatSpoken(amount, lang),
  };
}
