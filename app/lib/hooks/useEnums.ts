// app/lib/hooks/useEnums.ts
import { useEffect, useState } from "react";
import type { EnumMap } from "../queries/getEnums.server";

export function useEnums() {
  const [enums, setEnums] = useState<EnumMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/enums");
      const data: EnumMap = await res.json();
      setEnums(data);
      setLoading(false);
    })();
  }, []);

  return { enums, loading };
}
