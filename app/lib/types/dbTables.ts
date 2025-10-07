// app/lib.queries/types/dbTables.ts (optional convenience barrel)
import type { Database } from '../../../supabase/database.types';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

  export type Enum<T extends keyof Database["public"]["Enums"]> =
  Database['public']['Enums'][T];

  // Specific type exports for convenience
export type OfferRow = Tables<'offers'>;
export type OfferInsert = Inserts<'offers'>;
export type OfferUpdate = Updates<'offers'>;
export type OfferStatus = Enum<'offerStatus'>;

// Helper to get all enum values as an array
export function getEnumValues<T extends string>(enumObj: Record<string, T>): T[] {
  return Object.values(enumObj);
}

// Enum constants
export const OfferStatusEnum = {
  Offered: 'Offered' as const,
  Abandoned: 'Abandoned' as const,
  Accepted: 'Accepted' as const,
  Rejected: 'Rejected' as const,
  Expired: 'Expired' as const,
};

export type OfferStatusType = typeof OfferStatusEnum[keyof typeof OfferStatusEnum];