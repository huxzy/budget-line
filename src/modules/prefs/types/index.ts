export type Preferences = {
  /** LGA key as in the data, e.g. "BIDA". */
  lga: string | null;
  lgaLabel: string | null;
  /** State slug the remembered LGA belongs to. */
  state?: string | null;
  /** Language code from data/languages.json. */
  lang: string;
};
