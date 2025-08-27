// app/lib/types/enumTypes.ts

/** Map of enum name -> list of string values */
export type EnumMap = Record<string, string[]>;

/** Key type for an enum name in the map */
export type EnumKey<M extends EnumMap = EnumMap> = Extract<keyof M, string>;

/** Standard option shape for Polaris <Select> etc. */
export type EnumOption = { label: string; value: string };

/** Convert a list of strings to labeled options */
export const toOptions = (values: string[]): EnumOption[] =>
  values.map((v) => ({ label: v, value: v }));

/** Safely read an enum’s values (throws if missing) */
export function getEnumValues<M extends EnumMap, K extends EnumKey<M>>(
  map: M,
  key: K
): M[K] {
  const vals = map[key];
  if (!vals) throw new Error(`Enum "${key}" not found in EnumMap`);
  return vals;
}
