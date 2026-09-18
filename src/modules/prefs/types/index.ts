export type Preferences = {
  /** LGA key as in the data, e.g. "BIDA". */
  lga: string | null;
  lgaLabel: string | null;
  /** Language code from data/languages.json. */
  lang: string;
};
