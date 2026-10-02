import { describe, it, expect } from 'vitest';
import { ToastQueue, toastHoldMs } from '../utils/toastQueue';

describe('ToastQueue', () => {
  it('shows toasts one at a time, in order', () => {
    const q = new ToastQueue();
    q.enqueue({ text: 'a', type: 'coins' });
    q.enqueue({ text: 'b', type: 'milestone' });
    expect(q.start()?.text).toBe('a');
    expect(q.start()).toBeNull();
    q.finish();
    expect(q.start()?.text).toBe('b');
    q.finish();
    expect(q.start()).toBeNull();
  });

  it('drops a repeat of the toast showing or last queued', () => {
    const q = new ToastQueue();
    expect(q.enqueue({ text: 'a', type: 'coins' })).toBe(true);
    expect(q.enqueue({ text: 'a', type: 'coins' })).toBe(false);
    q.start();
    expect(q.enqueue({ text: 'a', type: 'coins' })).toBe(false);
    expect(q.enqueue({ text: 'b', type: 'coins' })).toBe(true);
    expect(q.enqueue({ text: 'a', type: 'coins' })).toBe(true);
  });

  it('keeps only the newest pending toasts', () => {
    const q = new ToastQueue();
    for (const t of ['1', '2', '3', '4', '5', '6']) q.enqueue({ text: t, type: 'coins' });
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) {
      const n = q.start();
      if (!n) break;
      seen.push(n.text);
      q.finish();
    }
    expect(seen).toEqual(['3', '4', '5', '6']);
  });

  it('drops coin toasts before milestones when over the limit', () => {
    const q = new ToastQueue();
    q.enqueue({ text: 'perfecta', type: 'milestone' });
    for (const t of ['c1', 'c2', 'c3', 'c4']) q.enqueue({ text: t, type: 'coins' });
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      const n = q.start();
      if (!n) break;
      seen.push(n.text);
      q.finish();
    }
    expect(seen).toEqual(['perfecta', 'c2', 'c3', 'c4']);
  });

  it('reset clears everything', () => {
    const q = new ToastQueue();
    q.enqueue({ text: 'a', type: 'coins' });
    q.start();
    q.enqueue({ text: 'b', type: 'coins' });
    q.reset();
    expect(q.start()).toBeNull();
  });
});

describe('toastHoldMs', () => {
  it('scales with length within bounds', () => {
    expect(toastHoldMs('')).toBe(2000);
    expect(toastHoldMs('x'.repeat(40))).toBe(3200);
    expect(toastHoldMs('x'.repeat(500))).toBe(5000);
  });
});
