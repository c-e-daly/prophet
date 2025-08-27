import * as React from "react";
import { createClient } from "../../utils/supabase/client"; // or wherever your browser Supabase client is

export function useEnumOptions(enumTypeName: string) {
  const [options, setOptions] = React.useState<Array<{label: string; value: string}>>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc<string[]>("get_pg_enum_labels", {
        enum_typename: enumTypeName,
      });

      if (!mounted) return;

      if (error) {
        setError(error.message ?? "Failed to load enum values");
        setOptions([]);
      } else {
        const opts = (data ?? []).map((label) => ({
          label,
          value: label,
        }));
        setOptions(opts);
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [enumTypeName]);

  return { options, loading, error };
}
