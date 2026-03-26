import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse } from '../types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: unknown[] = []
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const res = await fetcher();
    if (res.success && res.data !== undefined) {
      setState({ data: res.data, loading: false, error: null });
    } else {
      setState(prev => ({ ...prev, loading: false, error: res.error || 'Unknown error' }));
    }
  }, deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
