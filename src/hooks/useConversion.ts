import { useState, useCallback, useRef } from 'react';
import { ApiClient, ConversionRequest, ConversionProgress } from '../services/apiClient';
import { ConversionResults } from '../App';

export interface UseConversionOptions {
  onProgress?: (progress: ConversionProgress) => void;
  onSuccess?: (results: ConversionResults) => void;
  onError?: (error: Error) => void;
}

export interface ConversionState {
  isConverting: boolean;
  progress: ConversionProgress | null;
  results: ConversionResults | null;
  error: string | null;
}

export function useConversion(options: UseConversionOptions = {}) {
  const [state, setState] = useState<ConversionState>({
    isConverting: false,
    progress: null,
    results: null,
    error: null
  });

  const apiClientRef = useRef<ApiClient>(new ApiClient());
  const abortControllerRef = useRef<AbortController | null>(null);

  const startConversion = useCallback(async (request: ConversionRequest) => {
    // Reset state
    setState({
      isConverting: true,
      progress: null,
      results: null,
      error: null
    });

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      const results = await apiClientRef.current.convertFigmaToCode(
        request,
        (progress) => {
          setState(prev => ({ ...prev, progress }));
          options.onProgress?.(progress);
        }
      );

      setState(prev => ({
        ...prev,
        isConverting: false,
        results,
        progress: null
      }));

      options.onSuccess?.(results);
      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
      
      setState(prev => ({
        ...prev,
        isConverting: false,
        error: errorMessage,
        progress: null
      }));

      const errorObj = new Error(errorMessage);
      options.onError?.(errorObj);
      throw errorObj;
    }
  }, [options]);

  const cancelConversion = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      isConverting: false,
      progress: null,
      error: 'Conversion cancelled by user'
    }));
  }, []);

  const resetConversion = useCallback(() => {
    setState({
      isConverting: false,
      progress: null,
      results: null,
      error: null
    });
  }, []);

  const retryConversion = useCallback(async (request: ConversionRequest) => {
    setState(prev => ({ ...prev, error: null }));
    return startConversion(request);
  }, [startConversion]);

  return {
    ...state,
    startConversion,
    cancelConversion,
    resetConversion,
    retryConversion
  };
}

// Enhanced hook with caching and history
export function useConversionWithHistory(options: UseConversionOptions = {}) {
  const conversion = useConversion(options);
  const [history, setHistory] = useState<Array<{
    id: string;
    request: ConversionRequest;
    results: ConversionResults;
    timestamp: number;
  }>>([]);

  const startConversionWithHistory = useCallback(async (request: ConversionRequest) => {
    const results = await conversion.startConversion(request);
    
    if (results) {
      const historyEntry = {
        id: `conversion-${Date.now()}`,
        request,
        results,
        timestamp: Date.now()
      };

      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
    }

    return results;
  }, [conversion]);

  const getHistoryEntry = useCallback((id: string) => {
    return history.find(entry => entry.id === id);
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const rerunConversion = useCallback(async (id: string) => {
    const entry = getHistoryEntry(id);
    if (entry) {
      return startConversionWithHistory(entry.request);
    }
    throw new Error('Conversion history entry not found');
  }, [getHistoryEntry, startConversionWithHistory]);

  return {
    ...conversion,
    startConversion: startConversionWithHistory,
    history,
    getHistoryEntry,
    clearHistory,
    rerunConversion
  };
}

// Performance monitoring hook
export function useConversionPerformance() {
  const [metrics, setMetrics] = useState<{
    averageConversionTime: number;
    successRate: number;
    totalConversions: number;
    errorRate: number;
  }>({
    averageConversionTime: 0,
    successRate: 100,
    totalConversions: 0,
    errorRate: 0
  });

  const recordConversion = useCallback((
    duration: number, 
    success: boolean, 
    error?: Error
  ) => {
    setMetrics(prev => {
      const newTotal = prev.totalConversions + 1;
      const newSuccessCount = success ? 
        Math.round(prev.successRate * prev.totalConversions / 100) + 1 :
        Math.round(prev.successRate * prev.totalConversions / 100);
      
      const newAverage = success ? 
        (prev.averageConversionTime * prev.totalConversions + duration) / newTotal :
        prev.averageConversionTime;

      return {
        averageConversionTime: newAverage,
        successRate: (newSuccessCount / newTotal) * 100,
        totalConversions: newTotal,
        errorRate: ((newTotal - newSuccessCount) / newTotal) * 100
      };
    });
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      averageConversionTime: 0,
      successRate: 100,
      totalConversions: 0,
      errorRate: 0
    });
  }, []);

  return {
    metrics,
    recordConversion,
    resetMetrics
  };
}