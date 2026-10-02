import { describe, it, expect } from 'vitest';
import { decideSwipe, releaseVelocity, calculateExitPosition, exitDuration, SWIPE_CONFIG } from '../utils/swipePhysics';

const dist = SWIPE_CONFIG.CARD_WIDTH * SWIPE_CONFIG.DRAG_THRESHOLD;

describe('decideSwipe', () => {
  it('arrastrar más allá del umbral confirma hacia donde está la carta', () => {
    expect(decideSwipe(dist + 1, 0)).toBe('right');
    expect(decideSwipe(-(dist + 1), 0)).toBe('left');
  });
  it('un arrastre corto y lento regresa la carta', () => {
    expect(decideSwipe(dist - 10, 0.1)).toBeNull();
    expect(decideSwipe(-40, 0.2)).toBeNull();
  });
  it('un flick ligero confirma aunque no llegue al umbral', () => {
    expect(decideSwipe(50, SWIPE_CONFIG.VELOCITY_THRESHOLD + 0.2)).toBe('right');
    expect(decideSwipe(-50, -(SWIPE_CONFIG.VELOCITY_THRESHOLD + 0.2))).toBe('left');
  });
  it('un toque o temblor rápido sin recorrido no confirma', () => {
    expect(decideSwipe(5, 3)).toBeNull();
    expect(decideSwipe(0, -3)).toBeNull();
  });
  it('un flick va hacia donde se movía el dedo, no hacia el offset', () => {
    expect(decideSwipe(-30, 2)).toBe('right');
    expect(decideSwipe(30, -2)).toBe('left');
  });
});

describe('salida de la carta', () => {
  it('sale hacia el lado correcto, rotando en esa dirección', () => {
    const r = calculateExitPosition('right', 0);
    const l = calculateExitPosition('left', 0);
    expect(r.x).toBeGreaterThan(0);
    expect(r.rotate).toBeGreaterThan(0);
    expect(l.x).toBeLessThan(0);
    expect(l.rotate).toBeLessThan(0);
  });
  it('el impulso en el sentido del swipe alarga la salida; en contra no la acorta', () => {
    expect(calculateExitPosition('right', 2).x).toBeGreaterThan(calculateExitPosition('right', 0).x);
    expect(calculateExitPosition('right', -2).x).toBe(calculateExitPosition('right', 0).x);
    expect(calculateExitPosition('left', -2).x).toBeLessThan(calculateExitPosition('left', 0).x);
  });
  it('más velocidad, vuelo más corto, con un mínimo', () => {
    expect(exitDuration(0)).toBe(SWIPE_CONFIG.EXIT_DURATION);
    expect(exitDuration(2)).toBeLessThan(exitDuration(0.5));
    expect(exitDuration(99)).toBeGreaterThanOrEqual(SWIPE_CONFIG.EXIT_DURATION_MIN);
  });
});

describe('releaseVelocity', () => {
  it('un gesto corto usa su velocidad media cuando el puntero subestima', () => {
    expect(releaseVelocity(0.25, 70, 70)).toBeCloseTo(1, 5);
    expect(decideSwipe(70, releaseVelocity(0.25, 70, 70))).toBe('right');
  });
  it('un arrastre lento no se convierte en flick', () => {
    expect(releaseVelocity(0.1, 70, 900)).toBe(0.1);
    expect(decideSwipe(70, releaseVelocity(0.1, 70, 900))).toBeNull();
  });
  it('conserva la velocidad reportada si es mayor', () => {
    expect(releaseVelocity(3, 70, 200)).toBe(3);
  });
  it('un gesto sin tiempo medido no inventa velocidad', () => {
    expect(releaseVelocity(0.2, 70, 0)).toBe(0.2);
  });
});
