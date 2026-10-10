/** Value shown `progress` (0..1) of the way from 0 to `target`, easing out. */
export function countUpValue(target: number, progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  if (p >= 1) return target;
  const eased = 1 - Math.pow(1 - p, 3);
  return Math.round(target * eased);
}
