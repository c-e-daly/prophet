// app/lib/hooks/useEnumOptions.ts
import * as React from "react";
import { createClient } from "../../utils/supabase/server";

type SelectOption = { label: string; value: string };

/** Defensive parser: supports both v1/v2 typings & odd RPC shapes */
function coerceEnumLabels(data: unknown): string[] {
  // Case A: Postgres function returns text[] → data is string[]
  if (Array.isArray(data) && (data.length === 0 || typeof data[0] === "string")) {
    return data as string[];
  }
  // Case B: Supabase sometimes wraps as { get_pg_enum_labels: string[] }
  if (
    data &&
    typeof data === "object" &&
    "get_pg_enum_labels" in (data as any) &&
    Array.isArray((data as any).get_pg_enum_labels)
  ) {
    return (data as any).get_pg_enum_labels as string[];
  }
  // Case C: Single-row array of objects: [{ get_pg_enum_labels: [...] }]
  if (
    Array.isArray(data) &&
    data.length === 1 &&
    data[0] &&
    typeof data[0] === "object" &&
    "get_pg_enum_labels" in (data[0] as any)
  ) {
    return (data[0] as any).get_pg_enum_labels as string[];
  }
  return [];
}

export function useEnumOptions(enumTypeName: string) {
  const [options, setOptions] = React.useState<SelectOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const supabase = createClient();

    (async () => {
      setLoading(true);
      setError(null);

      // Don’t pass rpc generics; cast after the fact (works in v1 or v2)
      const result = await supabase.rpc("get_pg_enum_labels", {
        enum_typename: enumTypeName,
      });

      if (!alive) return;

      if (result.error) {
        setError(result.error.message ?? "Failed to load enum values");
        setOptions([]);
      } else {
        const labels = coerceEnumLabels(result.data as unknown);
        const opts = labels.map((label: string) => ({ label, value: label }));
        setOptions(opts);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [enumTypeName]);

  return { options, loading, error };
}
