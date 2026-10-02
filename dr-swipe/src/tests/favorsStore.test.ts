import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCodexStore } from '../store/useCodexStore';
import { FAVOR_CAP, REVIVE_FAVOR_COST } from '../utils/favorsEngine';

describe('Favores del Adjunto en el store', () => {
  beforeEach(() => useCodexStore.setState({ favors: 0, dailyStreak: 0, lastPlayedDate: null }));
  afterEach(() => vi.useRealTimers());

  it('gana con tope y gasta solo si alcanza', () => {
    const s = useCodexStore.getState();
    s.earnFavors(10);
    expect(useCodexStore.getState().favors).toBe(FAVOR_CAP);
    expect(useCodexStore.getState().spendFavors(REVIVE_FAVOR_COST)).toBe(true);
    expect(useCodexStore.getState().favors).toBe(FAVOR_CAP - REVIVE_FAVOR_COST);
    expect(useCodexStore.getState().spendFavors(99)).toBe(false);
    expect(useCodexStore.getState().favors).toBe(FAVOR_CAP - REVIVE_FAVOR_COST);
  });

  it('el primer día jugado paga un favor y jugar de nuevo ese día no paga otro', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T12:00:00Z'));
    useCodexStore.getState().updateDailyStreak();
    useCodexStore.getState().updateDailyStreak();
    expect(useCodexStore.getState().favors).toBe(1);
    expect(useCodexStore.getState().dailyStreak).toBe(1);
  });

  it('un día de ausencia conserva la racha; dos la rompen', () => {
    vi.useFakeTimers();
    useCodexStore.setState({ dailyStreak: 4, lastPlayedDate: '2026-09-30' });
    vi.setSystemTime(new Date('2026-10-02T12:00:00Z'));
    useCodexStore.getState().updateDailyStreak();
    expect(useCodexStore.getState().dailyStreak).toBe(5);

    useCodexStore.setState({ dailyStreak: 4, lastPlayedDate: '2026-09-29' });
    useCodexStore.getState().updateDailyStreak();
    expect(useCodexStore.getState().dailyStreak).toBe(1);
  });
});
