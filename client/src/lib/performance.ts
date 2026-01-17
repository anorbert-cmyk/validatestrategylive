/**
 * Performance monitoring utilities for debugging
 * 
 * Usage:
 * - perf.start('operation-name') - Start timing
 * - perf.end('operation-name') - End timing and log
 * - perf.mark('checkpoint') - Add performance mark
 * - perf.measure('name', 'start', 'end') - Measure between marks
 */

const isDev = import.meta.env.DEV;

interface PerfEntry {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
}

class PerformanceMonitor {
    private timers: Map<string, number> = new Map();
    private entries: PerfEntry[] = [];

    /**
     * Start timing an operation
     */
    start(name: string): void {
        if (!isDev) return;
        this.timers.set(name, performance.now());
    }

    /**
     * End timing and log result
     */
    end(name: string): number | null {
        if (!isDev) return null;

        const startTime = this.timers.get(name);
        if (!startTime) {
            console.warn(`[Perf] No timer found for: ${name}`);
            return null;
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        this.entries.push({ name, startTime, endTime, duration });
        this.timers.delete(name);

        const color = duration > 100 ? 'color: red' : duration > 50 ? 'color: orange' : 'color: green';
        console.log(`%c[Perf] ${name}: ${duration.toFixed(2)}ms`, color);

        return duration;
    }

    /**
     * Add a performance mark (uses native Performance API)
     */
    mark(name: string): void {
        if (!isDev) return;
        performance.mark(name);
    }

    /**
     * Measure between two marks
     */
    measure(name: string, startMark: string, endMark: string): PerformanceMeasure | null {
        if (!isDev) return null;
        try {
            return performance.measure(name, startMark, endMark);
        } catch (e) {
            console.warn(`[Perf] Could not measure ${name}:`, e);
            return null;
        }
    }

    /**
     * Get all recorded entries
     */
    getEntries(): PerfEntry[] {
        return [...this.entries];
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.timers.clear();
        this.entries = [];
        performance.clearMarks();
        performance.clearMeasures();
    }

    /**
     * Log a summary of all recorded timings
     */
    summary(): void {
        if (!isDev || this.entries.length === 0) return;

        console.group('[Perf] Summary');
        const sorted = [...this.entries].sort((a, b) => (b.duration || 0) - (a.duration || 0));
        sorted.forEach(entry => {
            console.log(`${entry.name}: ${entry.duration?.toFixed(2)}ms`);
        });
        console.groupEnd();
    }
}

export const perf = new PerformanceMonitor();

/**
 * React hook for measuring component render time
 * 
 * Usage:
 * function MyComponent() {
 *   useRenderPerf('MyComponent');
 *   return <div>...</div>;
 * }
 */
export function useRenderPerf(componentName: string): void {
    if (!isDev) return;

    const startTime = performance.now();

    // Using queueMicrotask to measure after render completes
    queueMicrotask(() => {
        const duration = performance.now() - startTime;
        if (duration > 16) { // Longer than one frame
            console.warn(`[Perf] Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
        }
    });
}

export default perf;
