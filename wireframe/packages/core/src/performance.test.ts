/**
 * Performance Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PerformanceCollector,
  benchmark,
  formatBenchmarkResult,
  compareBenchmarks,
  createTimer,
  debounce,
  throttle,
  perfCollector,
} from './performance';

describe('Performance Utilities', () => {
  describe('PerformanceCollector', () => {
    let collector: PerformanceCollector;

    beforeEach(() => {
      collector = new PerformanceCollector();
    });

    it('should measure function execution time', () => {
      const result = collector.measure('test', () => {
        // Simulate work
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });
      
      expect(result).toBe(499500);
      const measurements = collector.getMeasurements('test');
      expect(measurements.length).toBe(1);
      expect(measurements[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should get average duration', () => {
      collector.measure('test', () => {});
      collector.measure('test', () => {});
      collector.measure('test', () => {});
      
      const avg = collector.getAverageDuration('test');
      expect(avg).toBeGreaterThanOrEqual(0);
    });

    it('should get summary statistics', () => {
      collector.measure('test1', () => {});
      collector.measure('test2', () => {});
      collector.measure('test1', () => {});
      
      const summary = collector.getSummary();
      expect(summary.test1.count).toBe(2);
      expect(summary.test2.count).toBe(1);
    });

    it('should clear measurements', () => {
      collector.measure('test', () => {});
      collector.clear();
      expect(collector.getMeasurements().length).toBe(0);
    });
  });

  describe('benchmark', () => {
    it('should run benchmark and return statistics', () => {
      const result = benchmark('simple', () => {
        let sum = 0;
        for (let i = 0; i < 100; i++) sum += i;
        void sum; // Consume the value to avoid unused variable warning
      }, { iterations: 10, warmup: 2 });

      expect(result.name).toBe('simple');
      expect(result.iterations).toBe(10);
      expect(result.meanTime).toBeGreaterThanOrEqual(0);
      expect(result.minTime).toBeLessThanOrEqual(result.meanTime);
      expect(result.maxTime).toBeGreaterThanOrEqual(result.meanTime);
      expect(result.opsPerSecond).toBeGreaterThan(0);
    });
  });

  describe('formatBenchmarkResult', () => {
    it('should format result as string', () => {
      const result = {
        name: 'test',
        iterations: 100,
        totalTime: 50,
        meanTime: 0.5,
        minTime: 0.3,
        maxTime: 0.8,
        stdDev: 0.1,
        opsPerSecond: 2000,
      };

      const formatted = formatBenchmarkResult(result);
      expect(formatted).toContain('Benchmark: test');
      expect(formatted).toContain('Iterations: 100');
      expect(formatted).toContain('Mean: 0.500ms');
    });
  });

  describe('compareBenchmarks', () => {
    it('should compare two benchmarks', () => {
      const baseline = {
        name: 'old',
        iterations: 100,
        totalTime: 100,
        meanTime: 1.0,
        minTime: 0.8,
        maxTime: 1.2,
        stdDev: 0.1,
        opsPerSecond: 1000,
      };

      const current = {
        name: 'new',
        iterations: 100,
        totalTime: 50,
        meanTime: 0.5,
        minTime: 0.4,
        maxTime: 0.6,
        stdDev: 0.05,
        opsPerSecond: 2000,
      };

      const comparison = compareBenchmarks(baseline, current);
      expect(comparison.faster).toBe(true);
      expect(comparison.speedup).toBe(2);
      expect(comparison.percentChange).toBe(50);
    });
  });

  describe('createTimer', () => {
    it('should create a timer', () => {
      const timer = createTimer();
      expect(timer.elapsed()).toBeGreaterThanOrEqual(0);
    });

    it('should stop and return elapsed time', () => {
      const timer = createTimer();
      const elapsed = timer.stop();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = debounce(() => callCount++, 50);
      
      fn();
      fn();
      fn();
      
      expect(callCount).toBe(0);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(callCount).toBe(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      let callCount = 0;
      const fn = throttle(() => callCount++, 50);
      
      fn(); // First call goes through
      fn(); // Throttled
      fn(); // Throttled
      
      expect(callCount).toBe(1);
    });
  });

  describe('perfCollector', () => {
    it('should be a global instance', () => {
      expect(perfCollector).toBeInstanceOf(PerformanceCollector);
    });
  });
});
