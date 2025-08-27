import { useState, useEffect, useCallback } from 'react';
import { clientEnumCache } from '../enumCache.client';
import type { EnumMap } from '../types/enumTypes';

export function useEnums() {
  const [enums, setEnums] = useState<EnumMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadEnums = useCallback(async () => {
    try {
      setError(null);
      const data = await clientEnumCache.fetchEnums();
      setEnums(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshEnums = useCallback(async () => {
    try {
      setError(null);
      const data = await clientEnumCache.refresh();
      setEnums(data);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadEnums();

    // Subscribe to cache updates
    const unsubscribe = clientEnumCache.subscribe(() => {
      setEnums(clientEnumCache.getCached());
    });

    // Set up Server-Sent Events for real-time updates
    const eventSource = new EventSource('/api/enum-events');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'enum_changed') {
        console.log('Enum change detected, refreshing cache...');
        refreshEnums();
      }
    };

    eventSource.onerror = (error) => {
      console.warn('SSE connection error:', error);
    };

    return () => {
      unsubscribe();
      eventSource.close();
    };
  }, [loadEnums, refreshEnums]);

  return {
    enums,
    loading,
    error,
    refresh: refreshEnums,
    enumKeys: Object.keys(enums)
  };
}

export function useEnum(enumKey: string) {
  const { enums, loading, error } = useEnums();
  
  return {
    values: enums[enumKey] || [],
    loading,
    error,
    exists: enumKey in enums
  };
}