import * as React from "react";
import { Select } from "@shopify/polaris";
import { useEnumOptions } from "../lib/hooks/useEnumOptions";

type EnumSelectProps = {
  enumTypeName: string;          // e.g., "program_goal"
  label: string;                 // e.g., "Program Goal"
  value: string | undefined;     // controlled value
  onChange: (val: string) => void;
  includeEmpty?: boolean;        // show an "All" / blank at top (for filters)
  emptyLabel?: string;           // label for the empty option
  disabled?: boolean;
  error?: string;
  helpText?: string;
};

export function EnumSelect({
  enumTypeName,
  label,
  value,
  onChange,
  includeEmpty = false,
  emptyLabel = "Select…",
  disabled,
  error,
  helpText,
}: EnumSelectProps) {
  const { options, loading, error: loadError } = useEnumOptions(enumTypeName);

  const selectOptions = React.useMemo(() => {
    const base = options;
    return includeEmpty
      ? [{ label: emptyLabel, value: "" }, ...base]
      : base;
  }, [options, includeEmpty, emptyLabel]);

  const combinedError = error ?? (loadError ? `Failed to load: ${loadError}` : undefined);

  return (
    <Select
      label={label}
      options={selectOptions}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled || loading}
      error={combinedError}
      helpText={helpText ?? (loading ? "Loading…" : undefined)}
    />
  );
}
