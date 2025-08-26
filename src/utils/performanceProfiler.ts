import React, { useState, useEffect } from 'react';

export interface PerformanceProfile {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryBefore: number;
  memoryAfter?: number;
  memoryDelta?: number;
  metadata?: Record<string, any>;
}

export interface ProfilerConfig {
  enableMemoryTracking: boolean;
  enableDetailedTiming: boolean;
  enableAutomaticGC: boolean;
  sampleInterval: number;
  maxProfiles: number;
}

export class PerformanceProfiler {
  private profiles: Map<string, PerformanceProfile> = new Map();
  private config: ProfilerConfig;
  private gcInterval?: NodeJS.Timeout;

  constructor(config: Partial<ProfilerConfig> = {}) {
    this.config = {
      enableMemoryTracking: true,
      enableDetailedTiming: true,
      enableAutomaticGC: false,
      sampleInterval: 1000,
      maxProfiles: 100,
      ...config
    };

    if (this.config.enableAutomaticGC) {
      this.startGCMonitoring();
    }
  }

  startProfile(operationName: string, metadata?: Record<string, any>): string {
    const profileId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const profile: PerformanceProfile = {
      operationName,
      startTime: this.getHighResolutionTime(),
      memoryBefore: this.getMemoryUsage(),
      metadata
    };

    this.profiles.set(profileId, profile);
    
    // Cleanup old profiles if we exceed max
    if (this.profiles.size > this.config.maxProfiles) {
      const oldestKey = Array.from(this.profiles.keys())[0];
      this.profiles.delete(oldestKey);
    }

    return profileId;
  }

  endProfile(profileId: string): PerformanceProfile | null {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    const endTime = this.getHighResolutionTime();
    const memoryAfter = this.getMemoryUsage();

    const updatedProfile: PerformanceProfile = {
      ...profile,
      endTime,
      duration: endTime - profile.startTime,
      memoryAfter,
      memoryDelta: memoryAfter - profile.memoryBefore
    };

    this.profiles.set(profileId, updatedProfile);
    return updatedProfile;
  }

  getProfile(profileId: string): PerformanceProfile | null {
    return this.profiles.get(profileId) || null;
  }

  getAllProfiles(): PerformanceProfile[] {
    return Array.from(this.profiles.values());
  }

  getProfilesByOperation(operationName: string): PerformanceProfile[] {
    return Array.from(this.profiles.values())
      .filter(profile => profile.operationName === operationName);
  }

  getAveragePerformance(operationName: string): {
    averageDuration: number;
    averageMemoryDelta: number;
    sampleCount: number;
  } {
    const profiles = this.getProfilesByOperation(operationName)
      .filter(profile => profile.duration !== undefined);

    if (profiles.length === 0) {
      return { averageDuration: 0, averageMemoryDelta: 0, sampleCount: 0 };
    }

    const totalDuration = profiles.reduce((sum, profile) => sum + (profile.duration || 0), 0);
    const totalMemoryDelta = profiles.reduce((sum, profile) => sum + (profile.memoryDelta || 0), 0);

    return {
      averageDuration: totalDuration / profiles.length,
      averageMemoryDelta: totalMemoryDelta / profiles.length,
      sampleCount: profiles.length
    };
  }

  // Decorator for automatic profiling
  profile<T extends (...args: any[]) => any>(
    operationName: string,
    fn: T,
    metadata?: Record<string, any>
  ): T {
    return ((...args: Parameters<T>) => {
      const profileId = this.startProfile(operationName, metadata);
      
      try {
        const result = fn(...args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.finally(() => {
            this.endProfile(profileId);
          });
        }
        
        this.endProfile(profileId);
        return result;
      } catch (error) {
        this.endProfile(profileId);
        throw error;
      }
    }) as T;
  }

  // Async decorator
  profileAsync<T extends (...args: any[]) => Promise<any>>(
    operationName: string,
    fn: T,
    metadata?: Record<string, any>
  ): T {
    return (async (...args: Parameters<T>) => {
      const profileId = this.startProfile(operationName, metadata);
      
      try {
        const result = await fn(...args);
        this.endProfile(profileId);
        return result;
      } catch (error) {
        this.endProfile(profileId);
        throw error;
      }
    }) as T;
  }

  // Memory leak detection
  detectMemoryLeaks(): {
    suspiciousOperations: string[];
    recommendations: string[];
  } {
    const operationStats = new Map<string, {
      totalMemoryDelta: number;
      count: number;
      averageMemoryDelta: number;
    }>();

    // Analyze memory usage patterns
    this.getAllProfiles().forEach(profile => {
      if (profile.memoryDelta !== undefined) {
        const stats = operationStats.get(profile.operationName) || {
          totalMemoryDelta: 0,
          count: 0,
          averageMemoryDelta: 0
        };

        stats.totalMemoryDelta += profile.memoryDelta;
        stats.count += 1;
        stats.averageMemoryDelta = stats.totalMemoryDelta / stats.count;

        operationStats.set(profile.operationName, stats);
      }
    });

    const suspiciousOperations = Array.from(operationStats.entries())
      .filter(([_, stats]) => stats.averageMemoryDelta > 5) // 5MB average increase
      .map(([operationName]) => operationName);

    const recommendations = [];
    if (suspiciousOperations.length > 0) {
      recommendations.push('Consider implementing object pooling for frequently used objects');
      recommendations.push('Review event listener cleanup in components');
      recommendations.push('Check for circular references in data structures');
    }

    return { suspiciousOperations, recommendations };
  }

  // Performance bottleneck detection
  detectBottlenecks(): {
    slowOperations: Array<{ operation: string; averageDuration: number }>;
    recommendations: string[];
  } {
    const operationPerformance = new Map<string, number[]>();

    this.getAllProfiles().forEach(profile => {
      if (profile.duration !== undefined) {
        const durations = operationPerformance.get(profile.operationName) || [];
        durations.push(profile.duration);
        operationPerformance.set(profile.operationName, durations);
      }
    });

    const slowOperations = Array.from(operationPerformance.entries())
      .map(([operation, durations]) => ({
        operation,
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length
      }))
      .filter(({ averageDuration }) => averageDuration > 100) // Operations taking more than 100ms
      .sort((a, b) => b.averageDuration - a.averageDuration);

    const recommendations = [];
    if (slowOperations.length > 0) {
      recommendations.push('Consider implementing caching for expensive operations');
      recommendations.push('Use Web Workers for CPU-intensive tasks');
      recommendations.push('Implement progressive loading for large datasets');
    }

    return { slowOperations, recommendations };
  }

  // Export performance data
  exportData(): {
    profiles: PerformanceProfile[];
    summary: {
      totalOperations: number;
      averageDuration: number;
      totalMemoryUsed: number;
      operationBreakdown: Record<string, number>;
    };
    analysis: {
      memoryLeaks: ReturnType<typeof this.detectMemoryLeaks>;
      bottlenecks: ReturnType<typeof this.detectBottlenecks>;
    };
  } {
    const profiles = this.getAllProfiles();
    const completedProfiles = profiles.filter(p => p.duration !== undefined);

    const totalDuration = completedProfiles.reduce((sum, p) => sum + (p.duration || 0), 0);
    const totalMemory = completedProfiles.reduce((sum, p) => sum + Math.abs(p.memoryDelta || 0), 0);

    const operationBreakdown = completedProfiles.reduce((acc, profile) => {
      acc[profile.operationName] = (acc[profile.operationName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      profiles,
      summary: {
        totalOperations: completedProfiles.length,
        averageDuration: totalDuration / completedProfiles.length || 0,
        totalMemoryUsed: totalMemory,
        operationBreakdown
      },
      analysis: {
        memoryLeaks: this.detectMemoryLeaks(),
        bottlenecks: this.detectBottlenecks()
      }
    };
  }

  clearProfiles(): void {
    this.profiles.clear();
  }

  updateConfig(newConfig: Partial<ProfilerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enableAutomaticGC && !this.gcInterval) {
      this.startGCMonitoring();
    } else if (!this.config.enableAutomaticGC && this.gcInterval) {
      this.stopGCMonitoring();
    }
  }

  private getHighResolutionTime(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private startGCMonitoring(): void {
    this.gcInterval = setInterval(() => {
      if (typeof (globalThis as any).gc === 'function') {
        (globalThis as any).gc();
      }
    }, this.config.sampleInterval * 10);
  }

  private stopGCMonitoring(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = undefined;
    }
  }

  destroy(): void {
    this.stopGCMonitoring();
    this.clearProfiles();
  }
}

// Global profiler instance
export const globalProfiler = new PerformanceProfiler({
  enableMemoryTracking: true,
  enableDetailedTiming: true,
  enableAutomaticGC: false,
  maxProfiles: 200
});

// Utility functions for common profiling scenarios
export function profileFunction<T extends (...args: any[]) => any>(
  operationName: string,
  fn: T,
  metadata?: Record<string, any>
): T {
  return globalProfiler.profile(operationName, fn, metadata);
}

export function profileAsyncFunction<T extends (...args: any[]) => Promise<any>>(
  operationName: string,
  fn: T,
  metadata?: Record<string, any>
): T {
  return globalProfiler.profileAsync(operationName, fn, metadata);
}

// React hook for component performance profiling
export function useComponentProfiler(componentName: string) {
  const [renderCount, setRenderCount] = useState(0);
  const [averageRenderTime, setAverageRenderTime] = useState(0);
  const profilerRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Increment render count only once per mount
    setRenderCount(prev => prev + 1);
    
    // Start profiling
    profilerRef.current = globalProfiler.startProfile(`${componentName}-render`, {
      renderCount
    });

    return () => {
      // End profiling on unmount
      if (profilerRef.current) {
        const profile = globalProfiler.endProfile(profilerRef.current);
        if (profile && profile.duration && renderCount > 0) {
          setAverageRenderTime(prev => {
            if (renderCount === 1) return profile.duration!;
            const total = prev * (renderCount - 1) + profile.duration!;
            return total / renderCount;
          });
        }
        profilerRef.current = null;
      }
    };
  }, []); // Empty dependency array - runs only once

  return {
    renderCount,
    averageRenderTime,
    profileData: globalProfiler.getProfilesByOperation(`${componentName}-render`)
  };
}