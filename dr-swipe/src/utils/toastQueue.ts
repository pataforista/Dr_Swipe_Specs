export type ToastType = 'coins' | 'xp' | 'milestone';

export interface ToastItem {
  text: string;
  type: ToastType;
}

const MAX_PENDING = 4;
const MIN_HOLD_MS = 2000;
const MAX_HOLD_MS = 5000;
const MS_PER_CHAR = 30;

/** How long a toast stays up: longer text needs longer to read. */
export function toastHoldMs(text: string): number {
  return Math.min(MAX_HOLD_MS, MIN_HOLD_MS + text.length * MS_PER_CHAR);
}

/**
 * Toasts are shown one at a time. Several can fire in the same tick (coins,
 * favors and an achievement when a case ends), and a single-slot toast let the
 * last one overwrite the rest while an older hide-timer cut it short.
 */
export class ToastQueue {
  private pending: ToastItem[] = [];
  private current: ToastItem | null = null;

  /** Returns false when the toast was dropped as a duplicate. */
  enqueue(item: ToastItem): boolean {
    const last = this.pending[this.pending.length - 1] ?? this.current;
    if (last && last.text === item.text) return false;
    this.pending.push(item);
    // A long backlog would show stale news. Drop the oldest coin toast first so
    // milestones (perfect round, achievements) are the last to go.
    while (this.pending.length > MAX_PENDING) {
      const coin = this.pending.findIndex(p => p.type === 'coins');
      this.pending.splice(coin === -1 ? 0 : coin, 1);
    }
    return true;
  }

  /** Promotes the next pending toast, or null if one is showing or none wait. */
  start(): ToastItem | null {
    if (this.current) return null;
    this.current = this.pending.shift() ?? null;
    return this.current;
  }

  finish(): void {
    this.current = null;
  }

  reset(): void {
    this.pending = [];
    this.current = null;
  }
}
