// app/lib/enumCache.client.ts

import type { EnumMap } from './types/enumTypes';

class ClientEnumCache {
  private cache: EnumMap = {};
  private lastFetch = 0;
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes
  private listeners = new Set<() => void>();

  async fetchEnums(): Promise<EnumMap> {
    const now = Date.now();
    
    // Return cache if still valid
    if (this.lastFetch && (now - this.lastFetch) < this.TTL_MS && Object.keys(this.cache).length > 0) {
      return this.cache;
    }

    try {
      const response = await fetch('/api/enums');
      if (!response.ok) throw new Error('Failed to fetch enums');
      
      const data = await response.json();
      this.cache = data;
      this.lastFetch = now;
      this.notifyListeners();
      
      return data;
    } catch (error) {
      console.error('Failed to fetch enums:', error);
      return this.cache; // Return stale cache if available
    }
  }

  getCached(): EnumMap {
    return this.cache;
  }

  invalidate(): void {
    this.cache = {};
    this.lastFetch = 0;
  }

  // Subscribe to cache updates
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  // Force refresh from server
  async refresh(): Promise<EnumMap> {
    this.invalidate();
    return this.fetchEnums();
  }
}

export const clientEnumCache = new ClientEnumCache();