import { describe, it, expect } from 'vitest';
import { shuffleDeck, applyDeckOrder, caseFamily, pickDistinctFamilies } from '../utils/deckOrder';

// Deterministic rng so the tests don't flake.
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

describe('deck order', () => {
  const cards = Array.from({ length: 12 }, (_, i) => ({ card_id: `c_${i}` }));

  it('keeps every card and does not mutate the input', () => {
    const copy = [...cards];
    const out = shuffleDeck(cards, seeded(1));
    expect(cards).toEqual(copy);
    expect(out.map(c => c.card_id).sort()).toEqual(copy.map(c => c.card_id).sort());
  });

  it('puts different cards first across games', () => {
    const firsts = new Set(Array.from({ length: 40 }, (_, g) => shuffleDeck(cards, seeded(g + 7))[0].card_id));
    expect(firsts.size).toBeGreaterThan(5);
  });

  it('restores a saved order, and falls back to authored order without one', () => {
    const played = shuffleDeck(cards, seeded(3));
    expect(applyDeckOrder(cards, played.map(c => c.card_id))).toEqual(played);
    expect(applyDeckOrder(cards)).toEqual(cards);
  });
});

describe('case sampling', () => {
  const index = [
    'PROC_PED_MEASLES_001_001', 'PROC_PED_MEASLES_001_002', 'PROC_PED_MEASLES_001_003',
    'PROC_CARD_IAM_001_001', 'PROC_CARD_IAM_001_002',
    'PROC_GYN_ABO_001_001', 'PROC_SURG_APP_001_001', 'PROC_NEU_STROKE_001_001',
  ];

  it('derives the family from the case id', () => {
    expect(caseFamily('PROC_PED_MEASLES_001_014')).toBe('PROC_PED_MEASLES');
  });

  it('never returns two variants of the same disease in one shift', () => {
    for (let g = 0; g < 50; g++) {
      const ids = pickDistinctFamilies(index, 3, [], seeded(g));
      expect(new Set(ids.map(caseFamily)).size).toBe(3);
    }
  });

  it('avoids families played recently, and relaxes when the pool is small', () => {
    const recent = ['PROC_PED_MEASLES_001_002', 'PROC_CARD_IAM_001_001'];
    for (let g = 0; g < 50; g++) {
      const ids = pickDistinctFamilies(index, 3, recent, seeded(g));
      expect(ids.map(caseFamily)).not.toContain('PROC_PED_MEASLES');
      expect(ids.map(caseFamily)).not.toContain('PROC_CARD_IAM');
    }
    expect(pickDistinctFamilies(index, 6, recent, seeded(1))).toHaveLength(6);
  });

  it('different games draw different cases', () => {
    const games = new Set(Array.from({ length: 20 }, (_, g) => pickDistinctFamilies(index, 3, [], seeded(g * 13 + 1)).sort().join('|')));
    expect(games.size).toBeGreaterThan(5);
  });
});
