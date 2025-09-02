// app/components/enums/index.tsx
import * as React from "react";
import { useEnumContext } from "../../context/enumsContext";

// --- helpers ---
const toLabel = (k: string) =>
  k.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

type BaseProps = {
  enumKey: string;
  label?: string;          // optional UI label override
  className?: string;
  disabled?: boolean;
  required?: boolean;
  helpText?: string;
};

type SelectModeProps = BaseProps & {
  mode: "select";
  name?: string;
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

type FilterModeProps = BaseProps & {
  mode: "filter";
  selectedValues: string[];
  onChange: (vals: string[]) => void;
  showSelectAll?: boolean;
  compact?: boolean;       // simple compact rendering variant
  maxHeight?: string;      // scroll area height for checkbox list
};

// Unified public component props
export type DynamicEnumTypeProps = SelectModeProps | FilterModeProps;

export function DynamicEnumType(props: DynamicEnumTypeProps) {
  const { enums, loading } = useEnumContext();
  const options = enums[props.enumKey] || [];
  const label = props.label ?? toLabel(props.enumKey);

  if (loading) {
    return (
      <div className={props.className}>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <div className="text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={props.className}>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <div className="text-sm text-gray-500">No options available</div>
      </div>
    );
  }

  if (props.mode === "select") {
    const { name, value, onChange, placeholder = "Select an option", disabled, required, helpText } = props;

    return (
      <div className={props.className}>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <select
          name={name} 
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          {!required && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      </div>
    );
  }

  // mode === "filter"
  const { selectedValues, onChange, showSelectAll = true, compact = false, maxHeight = "220px", disabled, helpText } = props;

  const toggle = (value: string, checked: boolean) => {
    if (disabled) return;
    if (checked) onChange([...selectedValues, value]);
    else onChange(selectedValues.filter(v => v !== value));
  };

  const allSelected = selectedValues.length === options.length && options.length > 0;

  return (
    <div className={props.className}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}

      {showSelectAll && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => onChange(options)}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Clear
          </button>
          <span className="ml-auto text-xs text-gray-500">
            {allSelected ? "All selected" : `${selectedValues.length} / ${options.length}`}
          </span>
        </div>
      )}

      {/* list */}
      <div
        className={`overflow-y-auto border rounded ${compact ? "p-1 space-y-1" : "p-2 space-y-2"}`}
        style={{ maxHeight }}
      >
        {options.map((opt) => {
          const checked = selectedValues.includes(opt);
          return (
            <label key={opt} className={`flex items-center rounded ${compact ? "px-1 py-1" : "px-2 py-1"} hover:bg-gray-50`}>
              <input
                type="checkbox"
                className="mr-2"
                checked={checked}
                disabled={disabled}
                onChange={(e) => toggle(opt, e.target.checked)}
              />
              <span className="text-sm">{opt}</span>
            </label>
          );
        })}
      </div>

      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
}

// Optional utilities for pages
export function useEnumValues(enumKey: string) {
  const { enums } = useEnumContext();
  return enums[enumKey] || [];
}

export function useHasEnum(enumKey: string) {
  const { enums } = useEnumContext();
  return Boolean(enums[enumKey]);
}

