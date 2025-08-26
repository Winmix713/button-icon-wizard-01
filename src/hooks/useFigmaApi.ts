import { useState, useCallback, useRef } from 'react';
import { FigmaApiService, FigmaApiError } from '../services/figmaApi';
import type { 
  FigmaFile, 
  FigmaNode, 
  FigmaComponent, 
  FigmaStyle,
  ConversionConfig,
  DEFAULT_CONVERSION_CONFIG 
} from '../types/figma';

interface UseFigmaApiOptions {
  timeoutMs?: number;
  retry?: {
    attempts: number;
    delayMs: number;
    backoffMultiplier?: number;
  };
}

interface UseFigmaApiState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

export const useFigmaApi = (options?: UseFigmaApiOptions) => {
  const [state, setState] = useState<UseFigmaApiState>({
    isLoading: false,
    error: null,
    data: null,
  });

  // Create service instance once and reuse
  const serviceRef = useRef<FigmaApiService>(new FigmaApiService());

  const setToken = useCallback((token: string) => {
    try {
      serviceRef.current.setToken(token);
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Invalid token' 
      }));
    }
  }, []);

  const clearToken = useCallback(() => {
    serviceRef.current.setToken('');
    setState({ isLoading: false, error: null, data: null });
  }, []);

  const hasToken = useCallback(() => {
    return serviceRef.current.getToken() !== '';
  }, []);

  const makeApiCall = useCallback(async <T>(
    apiCall: (service: FigmaApiService) => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: FigmaApiError | Error) => void
  ) => {
    const needsDirectToken = !serviceRef.current.isMockMode() && !serviceRef.current.getUseProxy();
    if (needsDirectToken && !serviceRef.current.getToken()) {
      const error = 'No Figma API token configured for direct mode';
      setState(prev => ({ ...prev, error }));
      onError?.(new Error(error));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await apiCall(serviceRef.current);
      setState(prev => ({ ...prev, isLoading: false, data: result, error: null }));
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof FigmaApiError 
        ? `API Error: ${error.message}` 
        : error instanceof Error 
          ? error.message 
          : 'Unknown error occurred';
      
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      onError?.(error as FigmaApiError | Error);
      return null;
    }
  }, []);

  // Convenience methods for common API calls
  const getFile = useCallback(async (
    fileId: string,
    options?: any,
    callbacks?: {
      onSuccess?: (data: FigmaFile) => void;
      onError?: (error: FigmaApiError | Error) => void;
    }
  ) => {
    return makeApiCall(
      (service) => service.getFile(fileId),
      callbacks?.onSuccess,
      callbacks?.onError
    );
  }, [makeApiCall]);

  const getImages = useCallback(async (
    fileId: string,
    nodeIds: string[],
    options?: { format?: 'jpg' | 'png' | 'svg' | 'pdf'; scale?: number },
    callbacks?: {
      onSuccess?: (data: any) => void;
      onError?: (error: FigmaApiError | Error) => void;
    }
  ) => {
    return makeApiCall(
      (service) => service.getImages(fileId, nodeIds, options),
      callbacks?.onSuccess,
      callbacks?.onError
    );
  }, [makeApiCall]);

  const getFileNodes = useCallback(async (
    fileId: string,
    nodeIds: string[],
    options?: any,
    callbacks?: {
      onSuccess?: (data: any) => void;
      onError?: (error: FigmaApiError | Error) => void;
    }
  ) => {
    return makeApiCall(
      (service) => service.getFileNodes(fileId, nodeIds),
      callbacks?.onSuccess,
      callbacks?.onError
    );
  }, [makeApiCall]);

  // Utility methods
  const extractFileId = useCallback((url: string) => {
    return serviceRef.current.extractFileId(url);
  }, []);

  const validateToken = useCallback((token: string) => {
    return serviceRef.current.validateToken(token);
  }, []);

  const validateUrl = useCallback((url: string) => {
    return serviceRef.current.validateUrl(url);
  }, []);

  const testConnection = useCallback(async () => {
    return serviceRef.current.testConnection();
  }, []);

  return {
    // State
    ...state,
    
    // Token management
    setToken,
    clearToken,
    hasToken,
    
    // Basic API methods
    getFile,
    getImages,
    getFileNodes,
    makeApiCall,
    
    // Utilities
    extractFileId,
    validateToken,
    validateUrl,
    testConnection,
  };
};