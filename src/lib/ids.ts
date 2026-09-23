/** Deterministic ids for elements rendered many times on one page. */
let counter = 0;
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}
