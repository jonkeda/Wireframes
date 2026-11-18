/**
 * Sketch Path Tests
 */

import { describe, it, expect } from 'vitest';
import {
  sketchyLine,
  sketchyRect,
  sketchyRoundedRect,
  sketchyCircle,
  sketchyEllipse,
  sketchyPath,
} from './sketch';

/** All numbers in a path */
function numbers(path: string): number[] {
  return (path.match(/-?\d+(\.\d+)?/g) || []).map(Number);
}

describe('sketch', () => {
  describe('sketchyLine', () => {
    it('draws a short line straight', () => {
      expect(sketchyLine(0, 0, 2, 0)).toBe('M0 0 L2 0');
    });

    it('draws a longer line as one quadratic curve near its endpoints', () => {
      const path = sketchyLine(0, 0, 100, 0);
      expect(path).toMatch(/^M-?[\d.]+ -?[\d.]+ Q-?[\d.]+ -?[\d.]+ -?[\d.]+ -?[\d.]+$/);
      const [sx, sy, , , ex, ey] = numbers(path);
      expect(Math.abs(sx - 0)).toBeLessThanOrEqual(2);
      expect(Math.abs(sy - 0)).toBeLessThanOrEqual(2);
      expect(Math.abs(ex - 100)).toBeLessThanOrEqual(2);
      expect(Math.abs(ey - 0)).toBeLessThanOrEqual(2);
    });

    it('is deterministic for the same input and seed', () => {
      expect(sketchyLine(10, 20, 200, 40)).toBe(sketchyLine(10, 20, 200, 40));
      expect(sketchyLine(0, 0, 100, 0, { seed: 7 })).toBe(sketchyLine(0, 0, 100, 0, { seed: 7 }));
    });

    it('draws a straight line when roughness and bowing are 0', () => {
      const [sx, sy, cx, cy, ex, ey] = numbers(sketchyLine(0, 0, 100, 0, { roughness: 0, bowing: 0 }));
      expect([sx, sy, cx, cy, ex, ey].map((n) => Math.abs(n))).toEqual([0, 0, 50, 0, 100, 0]);
    });
  });

  describe('sketchyRect', () => {
    it('draws four sides', () => {
      const path = sketchyRect(0, 0, 100, 50);
      expect(path.match(/M/g)).toHaveLength(4);
      expect(path).toBe(sketchyRect(0, 0, 100, 50));
    });
  });

  describe('sketchyRoundedRect', () => {
    it('falls back to a plain sketchy rectangle for tiny radii', () => {
      expect(sketchyRoundedRect(0, 0, 100, 50, 1)).toBe(sketchyRect(0, 0, 100, 50));
    });

    it('draws one closed shape with curved corners', () => {
      const path = sketchyRoundedRect(0, 0, 100, 50, 8);
      expect(path.match(/M/g)).toHaveLength(1);
      expect(path.match(/Q/g)).toHaveLength(4);
      expect(path).toBe(sketchyRoundedRect(0, 0, 100, 50, 8));
    });
  });

  describe('sketchyCircle and sketchyEllipse', () => {
    it('draws a closed curve of 8 segments within the wobble of the radius', () => {
      const path = sketchyCircle(50, 50, 20);
      expect(path.endsWith(' Z')).toBe(true);
      expect(path.match(/C/g)).toHaveLength(8);
      const [mx, my] = numbers(path);
      expect(Math.hypot(mx - 50, my - 50)).toBeGreaterThan(17);
      expect(Math.hypot(mx - 50, my - 50)).toBeLessThan(23);
    });

    it('draws an ellipse as a closed curve and is deterministic', () => {
      const path = sketchyEllipse(50, 50, 30, 10);
      expect(path.endsWith(' Z')).toBe(true);
      expect(path.match(/C/g)).toHaveLength(8);
      expect(path).toBe(sketchyEllipse(50, 50, 30, 10));
    });
  });

  describe('sketchyPath', () => {
    it('returns the path unchanged', () => {
      expect(sketchyPath('M0 0 L10 10')).toBe('M0 0 L10 10');
    });
  });
});
