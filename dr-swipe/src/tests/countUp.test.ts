import { describe, it, expect } from 'vitest';
import { countUpValue } from '../utils/countUp';

describe('countUpValue', () => {
  it('starts at 0 and ends exactly on the target', () => {
    expect(countUpValue(480, 0)).toBe(0);
    expect(countUpValue(480, 1)).toBe(480);
  });
  it('clamps progress outside 0..1', () => {
    expect(countUpValue(100, -3)).toBe(0);
    expect(countUpValue(100, 7)).toBe(100);
  });
  it('eases out: past halfway at half the time, and never decreases', () => {
    expect(countUpValue(100, 0.5)).toBeGreaterThan(50);
    let prev = -1;
    for (let i = 0; i <= 20; i++) {
      const v = countUpValue(250, i / 20);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
  it('handles a zero target', () => {
    expect(countUpValue(0, 0.4)).toBe(0);
  });
});
