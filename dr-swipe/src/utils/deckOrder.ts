/**
 * Deck order and case sampling.
 *
 * Cards were always played in authored order, and in 582 of 599 cases the first
 * card is the vitals card, which is a discard 76% of the time: "#1 = vitals"
 * was a tell. The cards carry no cross-references (no "option A/B/C"), so a
 * shuffle is safe. The order played is persisted in the saved session so a
 * resume lands on the same card.
 */

/** Fisher-Yates over a copy. */
export function shuffleDeck<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Re-applies a saved order; cards missing from `order` keep their relative position at the end. */
export function applyDeckOrder<T extends { card_id: string }>(cards: readonly T[], order?: readonly string[]): T[] {
  if (!order || order.length === 0) return [...cards];
  const rank = new Map(order.map((id, i) => [id, i] as const));
  return [...cards].sort((a, b) => (rank.get(a.card_id) ?? Infinity) - (rank.get(b.card_id) ?? Infinity));
}

/**
 * "PROC_PED_EXANT_MEASLES_001_014" -> "PROC_PED_EXANT_MEASLES". The numbered
 * variants of a disease share ~97% of their cards (455 pairs are identical),
 * so picking them as "different cases" gave the same patient twice.
 */
export const caseFamily = (caseId: string): string => caseId.replace(/_\d+(_\d+)?$/, '');

/**
 * Picks `count` cases from distinct families (one random variant each),
 * avoiding families of recently played cases. Constraints relax in order:
 * recent families first, then distinct families, so a small pool still fills.
 */
export function pickDistinctFamilies(
  index: readonly string[],
  count: number,
  excludeIds: readonly string[] = [],
  rng: () => number = Math.random,
): string[] {
  const byFamily = new Map<string, string[]>();
  for (const id of index) {
    const fam = caseFamily(id);
    byFamily.set(fam, [...(byFamily.get(fam) ?? []), id]);
  }
  const recent = new Set(excludeIds.map(caseFamily));
  const fresh = shuffleDeck([...byFamily.keys()].filter(f => !recent.has(f)), rng);
  const stale = shuffleDeck([...byFamily.keys()].filter(f => recent.has(f)), rng);
  const families = [...fresh, ...stale].slice(0, count);
  const picked = families.map(f => {
    const variants = byFamily.get(f)!;
    return variants[Math.floor(rng() * variants.length)];
  });
  // Fewer families than requested: top up with other variants.
  if (picked.length < count) {
    const rest = shuffleDeck(index.filter(id => !picked.includes(id)), rng);
    picked.push(...rest.slice(0, count - picked.length));
  }
  return picked;
}
