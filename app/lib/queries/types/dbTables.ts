// app/lib.queries/types/dbTables.ts (optional convenience barrel)
import type { Database } from '../../../../supabase/database.types';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

  export type Enum<T extends keyof Database["public"]["Enums"]> =
  Database['public']['Enums'][T];
