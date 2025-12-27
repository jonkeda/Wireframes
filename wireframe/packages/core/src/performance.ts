/**
 * Performance Utilities for Wireframe
 * 
 * Provides benchmarking, profiling, and performance measurement tools.
 */

/**
 * Performance measurement result
 */
export interface MeasureResult {
  name: string;
  duration: number;
  memory?: number;
  timestamp: number;
}

/**
 * Benchmark result with statistics
 */
export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  meanTime: number;
  minTime: number;
  maxTime: number;
  stdDev: number;
  opsPerSecond: number;
}

/**
 * Performance metrics collector
 */
export class PerformanceCollector {
  private measurements: MeasureResult[] = [];
  private maxMeasurements: number;

  constructor(maxMeasurements: number = 1000) {
    this.maxMeasurements = maxMeasurements;
  }

  /**
   * Measure the execution time of a function
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    this.addMeasurement({
      name,
      duration: end - start,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Measure an async function
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    this.addMeasurement({
      name,
      duration: end - start,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Add a measurement
   */
  private addMeasurement(measurement: MeasureResult): void {
    this.measurements.push(measurement);
    
    // Trim old measurements if needed
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements = this.measurements.slice(-this.maxMeasurements);
    }
  }

  /**
   * Get measurements by name
   */
  getMeasurements(name?: string): MeasureResult[] {
    if (name) {
      return this.measurements.filter(m => m.name === name);
    }
    return [...this.measurements];
  }

  /**
   * Get average duration by name
   */
  getAverageDuration(name: string): number {
    const measurements = this.getMeasurements(name);
    if (measurements.length === 0) return 0;
    const total = measurements.reduce((sum, m) => sum + m.duration, 0);
    return total / measurements.length;
  }

  /**
   * Get summary statistics
   */
  getSummary(): Record<string, { count: number; avgDuration: number; totalDuration: number }> {
    const summary: Record<string, { count: number; avgDuration: number; totalDuration: number }> = {};

    for (const m of this.measurements) {
      if (!summary[m.name]) {
        summary[m.name] = { count: 0, avgDuration: 0, totalDuration: 0 };
      }
      summary[m.name].count++;
      summary[m.name].totalDuration += m.duration;
    }

    for (const name of Object.keys(summary)) {
      summary[name].avgDuration = summary[name].totalDuration / summary[name].count;
    }

    return summary;
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements = [];
  }
}

/**
 * Run a benchmark
 */
export function benchmark(
  name: string,
  fn: () => void,
  options: { iterations?: number; warmup?: number } = {}
): BenchmarkResult {
  const iterations = options.iterations || 100;
  const warmup = options.warmup || 10;

  // Warmup runs
  for (let i = 0; i < warmup; i++) {
    fn();
  }

  // Timed runs
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  // Calculate statistics
  const totalTime = times.reduce((a, b) => a + b, 0);
  const meanTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  // Standard deviation
  const variance = times.reduce((sum, t) => sum + Math.pow(t - meanTime, 2), 0) / iterations;
  const stdDev = Math.sqrt(variance);

  return {
    name,
    iterations,
    totalTime,
    meanTime,
    minTime,
    maxTime,
    stdDev,
    opsPerSecond: 1000 / meanTime,
  };
}

/**
 * Format benchmark result as string
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  return [
    `Benchmark: ${result.name}`,
    `  Iterations: ${result.iterations}`,
    `  Mean: ${result.meanTime.toFixed(3)}ms`,
    `  Min: ${result.minTime.toFixed(3)}ms`,
    `  Max: ${result.maxTime.toFixed(3)}ms`,
    `  Std Dev: ${result.stdDev.toFixed(3)}ms`,
    `  Ops/sec: ${result.opsPerSecond.toFixed(1)}`,
  ].join('\n');
}

/**
 * Compare two benchmark results
 */
export function compareBenchmarks(
  baseline: BenchmarkResult,
  current: BenchmarkResult
): { speedup: number; percentChange: number; faster: boolean } {
  const speedup = baseline.meanTime / current.meanTime;
  const percentChange = ((baseline.meanTime - current.meanTime) / baseline.meanTime) * 100;
  
  return {
    speedup,
    percentChange,
    faster: current.meanTime < baseline.meanTime,
  };
}

/**
 * Create a timer for manual timing
 */
export function createTimer(): { stop: () => number; elapsed: () => number } {
  const start = performance.now();
  
  return {
    stop: () => performance.now() - start,
    elapsed: () => performance.now() - start,
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Global performance collector instance
 */
export const perfCollector = new PerformanceCollector();
