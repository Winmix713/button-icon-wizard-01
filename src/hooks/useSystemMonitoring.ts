import { useState, useEffect, useCallback, useRef } from 'react';

export interface SystemMetrics {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
  timestamp: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  metric: keyof SystemMetrics;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

export interface MonitoringConfig {
  interval: number;
  thresholds: {
    cpu: { warning: number; critical: number };
    memory: { warning: number; critical: number };
    network: { warning: number; critical: number };
    storage: { warning: number; critical: number };
  };
  historySize: number;
  enableAlerts: boolean;
}

export function useSystemMonitoring(config: Partial<MonitoringConfig> = {}) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    network: 0,
    storage: 0,
    timestamp: Date.now()
  });
  const [history, setHistory] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const configRef = useRef<MonitoringConfig>({
    interval: 2000,
    thresholds: {
      cpu: { warning: 70, critical: 85 },
      memory: { warning: 75, critical: 90 },
      network: { warning: 100, critical: 200 },
      storage: { warning: 80, critical: 95 }
    },
    historySize: 50,
    enableAlerts: true,
    ...config
  });

  const collectMetrics = useCallback((): SystemMetrics => {
    const timestamp = Date.now();
    
    // Collect real metrics where available
    let memory = 0;
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      memory = ((performance as any).memory.usedJSHeapSize / 1024 / 1024 / 100) * 100; // Convert to percentage
    } else {
      memory = Math.random() * 40 + 30; // Fallback simulation
    }

    // Simulate other metrics (in real app, these would come from actual system APIs)
    const cpu = Math.random() * 60 + 20;
    const network = Math.random() * 50 + 25;
    const storage = Math.random() * 30 + 50;

    return {
      cpu,
      memory,
      network,
      storage,
      timestamp
    };
  }, []);

  const checkThresholds = useCallback((metrics: SystemMetrics) => {
    if (!configRef.current.enableAlerts) return;

    const newAlerts: PerformanceAlert[] = [];
    const thresholds = configRef.current.thresholds;

    Object.entries(thresholds).forEach(([metricName, threshold]) => {
      const value = metrics[metricName as keyof SystemMetrics] as number;
      
      if (value >= threshold.critical) {
        newAlerts.push({
          id: `${metricName}-critical-${Date.now()}`,
          type: 'error',
          metric: metricName as keyof SystemMetrics,
          value,
          threshold: threshold.critical,
          message: `Kritikus ${metricName} használat: ${Math.round(value)}%`,
          timestamp: Date.now()
        });
      } else if (value >= threshold.warning) {
        newAlerts.push({
          id: `${metricName}-warning-${Date.now()}`,
          type: 'warning',
          metric: metricName as keyof SystemMetrics,
          value,
          threshold: threshold.warning,
          message: `Magas ${metricName} használat: ${Math.round(value)}%`,
          timestamp: Date.now()
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 19)]); // Keep last 20 alerts
    }
  }, []);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return; // Already monitoring

    setIsMonitoring(true);
    
    intervalRef.current = setInterval(() => {
      const newMetrics = collectMetrics();
      
      setMetrics(newMetrics);
      setHistory(prev => [newMetrics, ...prev.slice(0, configRef.current.historySize - 1)]);
      
      checkThresholds(newMetrics);
    }, configRef.current.interval);
  }, [collectMetrics, checkThresholds]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getAverageMetrics = useCallback((timeWindow: number = 10): SystemMetrics => {
    const recentHistory = history.slice(0, timeWindow);
    if (recentHistory.length === 0) return metrics;

    const averages = recentHistory.reduce(
      (acc, metric) => ({
        cpu: acc.cpu + metric.cpu,
        memory: acc.memory + metric.memory,
        network: acc.network + metric.network,
        storage: acc.storage + metric.storage,
        timestamp: acc.timestamp
      }),
      { cpu: 0, memory: 0, network: 0, storage: 0, timestamp: Date.now() }
    );

    const count = recentHistory.length;
    return {
      cpu: averages.cpu / count,
      memory: averages.memory / count,
      network: averages.network / count,
      storage: averages.storage / count,
      timestamp: Date.now()
    };
  }, [history, metrics]);

  const getMetricTrend = useCallback((metric: keyof SystemMetrics, timeWindow: number = 10): 'up' | 'down' | 'stable' => {
    const recentHistory = history.slice(0, timeWindow);
    if (recentHistory.length < 2) return 'stable';

    const recent = recentHistory[0][metric] as number;
    const older = recentHistory[recentHistory.length - 1][metric] as number;
    const difference = recent - older;

    if (Math.abs(difference) < 5) return 'stable';
    return difference > 0 ? 'up' : 'down';
  }, [history]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isMonitoring,
    metrics,
    history,
    alerts,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    clearHistory,
    getAverageMetrics,
    getMetricTrend,
    config: configRef.current
  };
}

// Performance monitoring hook for specific operations
export function useOperationMonitoring() {
  const [operations, setOperations] = useState<Map<string, {
    startTime: number;
    endTime?: number;
    duration?: number;
    status: 'running' | 'completed' | 'failed';
    metadata?: any;
  }>>(new Map());

  const startOperation = useCallback((operationId: string, metadata?: any) => {
    setOperations(prev => new Map(prev).set(operationId, {
      startTime: performance.now(),
      status: 'running',
      metadata
    }));
  }, []);

  const endOperation = useCallback((operationId: string, success: boolean = true) => {
    setOperations(prev => {
      const operation = prev.get(operationId);
      if (!operation) return prev;

      const endTime = performance.now();
      const duration = endTime - operation.startTime;

      return new Map(prev).set(operationId, {
        ...operation,
        endTime,
        duration,
        status: success ? 'completed' : 'failed'
      });
    });
  }, []);

  const getOperationDuration = useCallback((operationId: string): number | null => {
    const operation = operations.get(operationId);
    if (!operation) return null;
    
    if (operation.duration) return operation.duration;
    if (operation.status === 'running') return performance.now() - operation.startTime;
    
    return null;
  }, [operations]);

  const getAverageOperationTime = useCallback((operationType?: string): number => {
    const completedOps = Array.from(operations.values())
      .filter(op => op.status === 'completed' && op.duration)
      .filter(op => !operationType || op.metadata?.type === operationType);

    if (completedOps.length === 0) return 0;

    const totalTime = completedOps.reduce((sum, op) => sum + (op.duration || 0), 0);
    return totalTime / completedOps.length;
  }, [operations]);

  const clearOperations = useCallback(() => {
    setOperations(new Map());
  }, []);

  return {
    operations: Array.from(operations.entries()).map(([id, data]) => ({ id, ...data })),
    startOperation,
    endOperation,
    getOperationDuration,
    getAverageOperationTime,
    clearOperations
  };
}