// app/context/EnumContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useEnums } from '../lib/hooks/useEnums';
import type { EnumMap } from '../lib/types/enumTypes';

interface EnumContextType {
  enums: EnumMap;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  enumKeys: string[];
}

const EnumContext = createContext<EnumContextType | null>(null);

export function EnumProvider({ children }: { children: ReactNode }) {
  const enumData = useEnums();

  return (
    <EnumContext.Provider value={enumData}>
      {children}
    </EnumContext.Provider>
  );
}

export function useEnumContext(): EnumContextType {
  const context = useContext(EnumContext);
  if (!context) {
    throw new Error('useEnumContext must be used within an EnumProvider');
  }
  return context;
}
